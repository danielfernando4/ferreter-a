from datetime import datetime, timezone
from typing import Optional, Tuple
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, attributes

from .models import Usuario, Rol, ConfiguracionNegocio, PreferenciasUsuario, TokenSesion, TokenRestablecimiento
from .utils import (
    hash_password,
    verify_password,
    generate_token,
    decode_token,
    generate_reset_token,
    hash_token,
    get_reset_token_expiry,
)
from .schemas import UserOut


# ─── Helper para cargar relaciones de Usuario ─────────────────────────────────

async def _get_user_by_id(db: AsyncSession, usuario_id: int) -> Optional[Usuario]:
    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.tokens_sesion),
            selectinload(Usuario.preferencias),
        )
        .where(Usuario.id == usuario_id)
    )
    return result.scalar_one_or_none()


async def _get_user_by_email(db: AsyncSession, email: str) -> Optional[Usuario]:
    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.tokens_sesion),
            selectinload(Usuario.preferencias),
        )
        .where(Usuario.email == email)
    )
    return result.scalar_one_or_none()


async def _get_user_out(user: Usuario) -> UserOut:
    return UserOut.model_validate(user)


# ─── Setup ───────────────────────────────────────────────────────────────────

async def check_setup_status(db: AsyncSession) -> Tuple[bool, bool]:
    """Returns (setup_completed, admin_exists)."""
    admin_result = await db.execute(
        select(Usuario).join(Rol).where(Rol.nombre == "administrador").limit(1)
    )
    admin_exists = admin_result.scalar_one_or_none() is not None

    config_result = await db.execute(
        select(ConfiguracionNegocio).where(ConfiguracionNegocio.setup_completado == True).limit(1)
    )
    config = config_result.scalar_one_or_none()
    setup_completed = config is not None

    return setup_completed, admin_exists


async def run_setup(
    db: AsyncSession,
    nombre_completo: str,
    email: str,
    password: str,
    negocio_nombre: str,
    negocio_direccion: str,
    negocio_rfc: str,
    negocio_telefono: Optional[str],
) -> Usuario:
    """Run the initial setup. Creates admin role, admin user, and business config."""
    # Check if setup already completed
    setup_completed, admin_exists = await check_setup_status(db)
    if setup_completed and admin_exists:
        raise ValueError("SETUP_ALREADY_COMPLETED")

    # Get or create admin role
    admin_rol = await _get_or_create_rol(db, "administrador", "Acceso total al sistema")

    # Create admin user
    password_hashed = hash_password(password)
    admin_user = Usuario(
        nombre_completo=nombre_completo,
        email=email,
        password_hash=password_hashed,
        activo=True,
        rol_id=admin_rol.id,
        ultimo_acceso=datetime.now(timezone.utc),
    )
    db.add(admin_user)
    await db.flush()

    # Create preferences for admin
    prefs = PreferenciasUsuario(usuario_id=admin_user.id)
    db.add(prefs)

    # Create business config
    config = ConfiguracionNegocio(
        nombre=negocio_nombre,
        direccion=negocio_direccion,
        datos_fiscales=negocio_rfc,
        telefono=negocio_telefono,
        setup_completado=True,
    )
    db.add(config)

    # Create seller and warehouse roles too
    await _get_or_create_rol(db, "vendedor", "Acceso al punto de venta y clientes")
    await _get_or_create_rol(db, "almacen", "Acceso a inventario y órdenes de compra")

    await db.commit()
    await db.refresh(admin_user)
    # Reload with relationships
    result = await _get_user_by_id(db, admin_user.id)
    return result


async def _get_or_create_rol(db: AsyncSession, nombre: str, descripcion: str) -> Rol:
    result = await db.execute(select(Rol).where(Rol.nombre == nombre))
    rol = result.scalar_one_or_none()
    if not rol:
        rol = Rol(nombre=nombre, descripcion=descripcion)
        db.add(rol)
        await db.flush()
    return rol


# ─── Login ───────────────────────────────────────────────────────────────────

async def login_user(
    db: AsyncSession, email: str, password: str, remember: bool = False
) -> Tuple[str, int, Usuario]:
    """Authenticate user. Returns (token, expires_in, user)."""
    user = await _get_user_by_email(db, email)
    if not user or not user.activo:
        raise ValueError("INVALID_CREDENTIALS")

    if not verify_password(password, user.password_hash):
        raise ValueError("INVALID_CREDENTIALS")

    # Update last access
    user.ultimo_acceso = datetime.now(timezone.utc)

    # Generate token
    token, expires_in = generate_token(user.id, remember=remember)

    # Store token hash in DB
    token_hashed = hash_token(token)
    from datetime import timedelta
    if remember:
        expiry = datetime.now(timezone.utc) + timedelta(days=30)
    else:
        expiry = datetime.now(timezone.utc) + timedelta(hours=1)

    sesion = TokenSesion(
        usuario_id=user.id,
        token_hash=token_hashed,
        es_persistente=remember,
        fecha_expiracion=expiry,
    )
    db.add(sesion)
    await db.commit()
    await db.refresh(user)

    return token, expires_in, user


# ─── Logout ──────────────────────────────────────────────────────────────────

async def logout_user(db: AsyncSession, token: str) -> None:
    """Invalidate the session token."""
    token_hashed = hash_token(token)
    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.token_hash == token_hashed,
            TokenSesion.activo == True,
        )
    )
    sesion = result.scalar_one_or_none()
    if sesion:
        sesion.activo = False
        await db.commit()


# ─── Get Current User ─────────────────────────────────────────────────────────

async def get_current_user_from_token(db: AsyncSession, token: str) -> Usuario:
    """Validate token and return the user. Raises ValueError on failure."""
    try:
        payload = decode_token(token)
    except Exception:
        raise ValueError("UNAUTHORIZED")

    usuario_id = int(payload.get("sub"))
    if not usuario_id:
        raise ValueError("UNAUTHORIZED")

    # Check token is still active in DB
    token_hashed = hash_token(token)
    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.token_hash == token_hashed,
            TokenSesion.activo == True,
            TokenSesion.fecha_expiracion > datetime.now(timezone.utc),
        )
    )
    sesion = result.scalar_one_or_none()
    if not sesion:
        raise ValueError("UNAUTHORIZED")

    user = await _get_user_by_id(db, usuario_id)
    if not user or not user.activo:
        raise ValueError("UNAUTHORIZED")

    return user


# ─── Forgot / Reset Password ────────────────────────────────────────────────

async def forgot_password(db: AsyncSession, email: str) -> Optional[str]:
    """Generate a reset token for the user. Returns the raw token or None if email not found."""
    user = await _get_user_by_email(db, email)
    if not user:
        return None

    raw_token = generate_reset_token()
    token_hashed = hash_token(raw_token)

    reset_token = TokenRestablecimiento(
        usuario_id=user.id,
        token_hash=token_hashed,
        fecha_expiracion=get_reset_token_expiry(),
    )
    db.add(reset_token)
    await db.commit()

    return raw_token


async def verify_reset_token(db: AsyncSession, raw_token: str) -> Optional[str]:
    """Verify a reset token. Returns the user's email if valid, None otherwise."""
    token_hashed = hash_token(raw_token)
    result = await db.execute(
        select(TokenRestablecimiento).where(
            TokenRestablecimiento.token_hash == token_hashed,
            TokenRestablecimiento.utilizado == False,
            TokenRestablecimiento.fecha_expiracion > datetime.now(timezone.utc),
        )
    )
    reset_token = result.scalar_one_or_none()
    if not reset_token:
        return None

    user = await _get_user_by_id(db, reset_token.usuario_id)
    if not user:
        return None
    return user.email


async def reset_password(db: AsyncSession, raw_token: str, new_password: str) -> bool:
    """Reset password using a valid reset token. Returns True on success."""
    token_hashed = hash_token(raw_token)
    result = await db.execute(
        select(TokenRestablecimiento).where(
            TokenRestablecimiento.token_hash == token_hashed,
            TokenRestablecimiento.utilizado == False,
            TokenRestablecimiento.fecha_expiracion > datetime.now(timezone.utc),
        )
    )
    reset_token = result.scalar_one_or_none()
    if not reset_token:
        return False

    user = await _get_user_by_id(db, reset_token.usuario_id)
    if not user:
        return False

    user.password_hash = hash_password(new_password)
    reset_token.utilizado = True
    await db.commit()
    return True


# ─── User CRUD ───────────────────────────────────────────────────────────────

async def list_usuarios(
    db: AsyncSession,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
) -> Tuple[list, int]:
    """List users with pagination and optional search."""
    query = (
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.tokens_sesion),
            selectinload(Usuario.preferencias),
        )
    )

    count_query = select(func.count(Usuario.id))

    if search:
        pattern = f"%{search}%"
        query = query.where(
            (Usuario.nombre_completo.ilike(pattern)) | (Usuario.email.ilike(pattern))
        )
        count_query = count_query.where(
            (Usuario.nombre_completo.ilike(pattern)) | (Usuario.email.ilike(pattern))
        )

    # Get total count
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.order_by(Usuario.id).offset(offset).limit(page_size)

    result = await db.execute(query)
    users = list(result.scalars().all())

    total_pages = max(1, (total + page_size - 1) // page_size)

    return users, total, total_pages


async def get_usuario_by_id(db: AsyncSession, usuario_id: int) -> Optional[Usuario]:
    return await _get_user_by_id(db, usuario_id)


async def create_usuario(
    db: AsyncSession,
    nombre_completo: str,
    email: str,
    password: str,
    rol_nombre: str,
) -> Usuario:
    """Create a new user. Raises ValueError on duplicate email or invalid role."""
    # Check email uniqueness
    existing = await _get_user_by_email(db, email)
    if existing:
        raise ValueError("EMAIL_EXISTS")

    # Get role
    result = await db.execute(select(Rol).where(Rol.nombre == rol_nombre))
    rol = result.scalar_one_or_none()
    if not rol:
        raise ValueError("INVALID_DATA")

    password_hashed = hash_password(password)
    user = Usuario(
        nombre_completo=nombre_completo,
        email=email,
        password_hash=password_hashed,
        activo=True,
        rol_id=rol.id,
    )
    db.add(user)
    await db.flush()

    # Create default preferences
    prefs = PreferenciasUsuario(usuario_id=user.id)
    db.add(prefs)
    await db.commit()

    result = await _get_user_by_id(db, user.id)
    return result


async def update_usuario(
    db: AsyncSession,
    usuario_id: int,
    nombre_completo: Optional[str] = None,
    email: Optional[str] = None,
    rol_nombre: Optional[str] = None,
) -> Usuario:
    """Update user fields. Raises ValueError on conflict."""
    user = await _get_user_by_id(db, usuario_id)
    if not user:
        raise ValueError("NOT_FOUND")

    if email is not None and email != user.email:
        existing = await _get_user_by_email(db, email)
        if existing:
            raise ValueError("EMAIL_EXISTS")
        user.email = email

    if nombre_completo is not None:
        user.nombre_completo = nombre_completo

    if rol_nombre is not None:
        result = await db.execute(select(Rol).where(Rol.nombre == rol_nombre))
        rol = result.scalar_one_or_none()
        if not rol:
            raise ValueError("INVALID_DATA")
        user.rol_id = rol.id
        # Invalidate all active tokens on role change
        await _invalidate_user_tokens(db, usuario_id)

    await db.commit()
    result = await _get_user_by_id(db, usuario_id)
    return result


async def deactivate_usuario(db: AsyncSession, usuario_id: int, current_user_id: int) -> Usuario:
    """Deactivate a user. Cannot deactivate self."""
    if usuario_id == current_user_id:
        raise ValueError("CANNOT_DEACTIVATE_SELF")

    user = await _get_user_by_id(db, usuario_id)
    if not user:
        raise ValueError("NOT_FOUND")

    user.activo = False

    # Invalidate all tokens
    await _invalidate_user_tokens(db, usuario_id)

    await db.commit()
    result = await _get_user_by_id(db, usuario_id)
    return result


async def reactivate_usuario(db: AsyncSession, usuario_id: int) -> Usuario:
    user = await _get_user_by_id(db, usuario_id)
    if not user:
        raise ValueError("NOT_FOUND")

    user.activo = True
    await db.commit()
    result = await _get_user_by_id(db, usuario_id)
    return result


async def _invalidate_user_tokens(db: AsyncSession, usuario_id: int) -> None:
    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.usuario_id == usuario_id,
            TokenSesion.activo == True,
        )
    )
    tokens = list(result.scalars().all())
    for t in tokens:
        t.activo = False


# ─── Perfil ──────────────────────────────────────────────────────────────────

async def update_perfil(
    db: AsyncSession, usuario_id: int, nombre_completo: Optional[str] = None, email: Optional[str] = None
) -> Usuario:
    user = await _get_user_by_id(db, usuario_id)
    if not user:
        raise ValueError("NOT_FOUND")

    if email is not None and email != user.email:
        existing = await _get_user_by_email(db, email)
        if existing:
            raise ValueError("EMAIL_EXISTS")
        user.email = email

    if nombre_completo is not None:
        user.nombre_completo = nombre_completo

    await db.commit()
    result = await _get_user_by_id(db, usuario_id)
    return result


async def change_password(
    db: AsyncSession, usuario_id: int, current_password: str, new_password: str
) -> bool:
    user = await _get_user_by_id(db, usuario_id)
    if not user:
        raise ValueError("NOT_FOUND")

    if not verify_password(current_password, user.password_hash):
        raise ValueError("INVALID_CURRENT_PASSWORD")

    user.password_hash = hash_password(new_password)
    await db.commit()
    return True


# ─── Preferencias ────────────────────────────────────────────────────────────

async def get_preferencias(db: AsyncSession, usuario_id: int) -> PreferenciasUsuario:
    result = await db.execute(
        select(PreferenciasUsuario).where(PreferenciasUsuario.usuario_id == usuario_id)
    )
    prefs = result.scalar_one_or_none()
    if not prefs:
        prefs = PreferenciasUsuario(usuario_id=usuario_id)
        db.add(prefs)
        await db.commit()
        await db.refresh(prefs)
    return prefs


async def update_preferencias(
    db: AsyncSession,
    usuario_id: int,
    idioma: Optional[str] = None,
    tema_visual: Optional[str] = None,
    zona_horaria: Optional[str] = None,
) -> PreferenciasUsuario:
    prefs = await get_preferencias(db, usuario_id)
    if idioma is not None:
        prefs.idioma = idioma
    if tema_visual is not None:
        prefs.tema_visual = tema_visual
    if zona_horaria is not None:
        prefs.configuracion_regional = zona_horaria
    await db.commit()
    await db.refresh(prefs)
    return prefs
