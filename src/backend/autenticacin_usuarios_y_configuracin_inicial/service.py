from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .models import (
    Usuario,
    Rol,
    ConfiguracionNegocio,
    PreferenciasUsuario,
    TokenSesion,
    TokenRestablecimiento,
)
from .schemas import (
    UserOut,
    SetupRequest,
    UserCreateRequest,
    UserUpdateRequest,
    PreferenciasOut,
    PreferenciasUpdateRequest,
    ROLES_VALIDOS,
)
from .utils import (
    hash_password,
    verify_password,
    generate_session_token,
    compute_token_hash,
    get_session_expiry,
    get_reset_token_expiry,
)


# ─── Helpers ────────────────────────────────────────────────────────────
async def _get_rol_by_name(db: AsyncSession, nombre: str) -> Rol:
    result = await db.execute(select(Rol).where(Rol.nombre == nombre))
    rol = result.scalar_one_or_none()
    if rol is None:
        # Create the role if it doesn't exist
        desc = {
            "administrador": "Acceso completo al sistema",
            "vendedor": "Acceso al punto de venta y consulta de inventario",
            "almacen": "Acceso a inventario, órdenes de compra y proveedores",
        }
        rol = Rol(nombre=nombre, descripcion=desc.get(nombre, ""))
        db.add(rol)
        await db.flush()
    return rol


async def _user_to_out(db: AsyncSession, usuario: Usuario) -> UserOut:
    """Convert Usuario ORM to UserOut schema with loaded relationships."""
    # Ensure role is loaded
    if not hasattr(usuario, "rol") or usuario.rol is None:
        result = await db.execute(
            select(Usuario)
            .options(selectinload(Usuario.rol))
            .where(Usuario.id == usuario.id)
        )
        usuario = result.scalar_one()
    return UserOut(
        id=usuario.id,
        nombre_completo=usuario.nombre_completo,
        email=usuario.email,
        rol=usuario.rol,
        activo=usuario.activo,
        fecha_registro=usuario.fecha_creacion,
        ultimo_acceso=usuario.ultimo_acceso,
    )


# ─── Setup Wizard ───────────────────────────────────────────────────────
async def check_setup(db: AsyncSession) -> Tuple[bool, bool]:
    """Check if setup is completed and if admin exists."""
    result = await db.execute(
        select(ConfiguracionNegocio).where(ConfiguracionNegocio.setup_completado == True)
    )
    config = result.scalar_one_or_none()

    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .join(Usuario.rol)
        .where(Rol.nombre == "administrador", Usuario.activo == True)
    )
    admin = result.scalar_one_or_none()

    return config is not None, admin is not None


async def run_setup(db: AsyncSession, data: SetupRequest) -> UserOut:
    """Execute the initial setup wizard."""
    # Check if already completed
    _, admin_exists = await check_setup(db)
    if admin_exists:
        raise ValueError("SETUP_ALREADY_COMPLETED")

    # Create admin role if needed
    rol = await _get_rol_by_name(db, "administrador")

    # Create admin user
    usuario = Usuario(
        nombre_completo=data.nombre_completo,
        email=data.email,
        password_hash=hash_password(data.password),
        activo=True,
        rol_id=rol.id,
        fecha_creacion=datetime.now(timezone.utc),
        fecha_actualizacion=datetime.now(timezone.utc),
    )
    db.add(usuario)
    await db.flush()

    # Create default preferences
    preferencias = PreferenciasUsuario(
        usuario_id=usuario.id,
        idioma="es",
        tema_visual="light",
        configuracion_regional="es-MX",
    )
    db.add(preferencias)

    # Create business config
    config = ConfiguracionNegocio(
        nombre=data.negocio_nombre,
        direccion=data.negocio_direccion,
        datos_fiscales=data.negocio_rfc,
        telefono=data.negocio_telefono,
        email_contacto=data.email,
        setup_completado=True,
        fecha_creacion=datetime.now(timezone.utc),
    )
    db.add(config)
    await db.commit()
    await db.refresh(usuario)

    return await _user_to_out(db, usuario)


# ─── Authentication ─────────────────────────────────────────────────────
async def authenticate_user(
    db: AsyncSession, email: str, password: str
) -> Optional[Usuario]:
    """Authenticate a user by email and password. Returns user or None."""
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.email == email, Usuario.activo == True)
    )
    user = result.scalar_one_or_none()

    if user is None:
        return None

    if not verify_password(password, user.password_hash):
        return None

    # Update last access
    user.ultimo_acceso = datetime.now(timezone.utc)
    await db.flush()

    return user


async def create_session(
    db: AsyncSession, user: Usuario, remember: bool = False
) -> Tuple[str, datetime]:
    """Create a session token for the user. Returns (token, expiry)."""
    token = generate_session_token()
    token_hash = compute_token_hash(token)
    expiry = get_session_expiry(remember)

    session = TokenSesion(
        usuario_id=user.id,
        token_hash=token_hash,
        es_persistente=remember,
        fecha_expiracion=expiry,
        fecha_creacion=datetime.now(timezone.utc),
        activo=True,
    )
    db.add(session)
    await db.flush()

    return token, expiry


async def invalidate_session(db: AsyncSession, token: str) -> None:
    """Invalidate a session token."""
    token_hash = compute_token_hash(token)
    result = await db.execute(
        select(TokenSesion).where(TokenSesion.token_hash == token_hash)
    )
    session = result.scalar_one_or_none()
    if session:
        session.activo = False
        await db.flush()


async def invalidate_user_sessions(db: AsyncSession, user_id: int) -> None:
    """Invalidate all active sessions for a user."""
    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.usuario_id == user_id,
            TokenSesion.activo == True,
        )
    )
    sessions = result.scalars().all()
    for session in sessions:
        session.activo = False
    if sessions:
        await db.flush()


# ─── Password Reset ─────────────────────────────────────────────────────
async def create_reset_token(db: AsyncSession, email: str) -> Optional[str]:
    """Create a password reset token for the user with the given email.
    Returns the token string or None if email not found."""
    result = await db.execute(
        select(Usuario).where(Usuario.email == email, Usuario.activo == True)
    )
    user = result.scalar_one_or_none()
    if user is None:
        return None

    token = generate_session_token()
    token_hash = compute_token_hash(token)
    expiry = get_reset_token_expiry()

    reset_token = TokenRestablecimiento(
        usuario_id=user.id,
        token_hash=token_hash,
        fecha_expiracion=expiry,
        utilizado=False,
        fecha_creacion=datetime.now(timezone.utc),
    )
    db.add(reset_token)
    await db.flush()

    return token


async def verify_reset_token(
    db: AsyncSession, token: str
) -> Optional[str]:
    """Verify a reset token. Returns the user's email if valid, None otherwise."""
    token_hash = compute_token_hash(token)
    result = await db.execute(
        select(TokenRestablecimiento)
        .options(selectinload(TokenRestablecimiento.usuario))
        .where(
            TokenRestablecimiento.token_hash == token_hash,
            TokenRestablecimiento.utilizado == False,
            TokenRestablecimiento.fecha_expiracion > datetime.now(timezone.utc),
        )
    )
    reset_token = result.scalar_one_or_none()
    if reset_token is None:
        return None

    return reset_token.usuario.email


async def reset_password(
    db: AsyncSession, token: str, new_password: str
) -> bool:
    """Reset password using a valid reset token. Returns True if successful."""
    token_hash = compute_token_hash(token)
    result = await db.execute(
        select(TokenRestablecimiento)
        .options(selectinload(TokenRestablecimiento.usuario))
        .where(
            TokenRestablecimiento.token_hash == token_hash,
            TokenRestablecimiento.utilizado == False,
            TokenRestablecimiento.fecha_expiracion > datetime.now(timezone.utc),
        )
    )
    reset_token = result.scalar_one_or_none()
    if reset_token is None:
        return False

    # Update password
    user = reset_token.usuario
    user.password_hash = hash_password(new_password)
    user.fecha_actualizacion = datetime.now(timezone.utc)

    # Mark token as used
    reset_token.utilizado = True

    # Invalidate all active sessions for this user
    await invalidate_user_sessions(db, user.id)

    await db.flush()
    return True


# ─── User Management ────────────────────────────────────────────────────
async def list_usuarios(
    db: AsyncSession,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
) -> Tuple[List[UserOut], int]:
    """List users with pagination and optional search."""
    query = select(Usuario).options(selectinload(Usuario.rol))

    if search:
        search_filter = or_(
            Usuario.nombre_completo.ilike(f"%{search}%"),
            Usuario.email.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    query = query.order_by(Usuario.fecha_creacion.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    users = result.scalars().all()

    items = []
    for u in users:
        items.append(
            UserOut(
                id=u.id,
                nombre_completo=u.nombre_completo,
                email=u.email,
                rol=u.rol,
                activo=u.activo,
                fecha_registro=u.fecha_creacion,
                ultimo_acceso=u.ultimo_acceso,
            )
        )

    return items, total


async def get_usuario(db: AsyncSession, user_id: int) -> Optional[Usuario]:
    """Get a single user by ID."""
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.id == user_id)
    )
    return result.scalar_one_or_none()


async def create_usuario(
    db: AsyncSession, data: UserCreateRequest
) -> UserOut:
    """Create a new user."""
    # Check if email already exists
    result = await db.execute(
        select(Usuario).where(Usuario.email == data.email)
    )
    if result.scalar_one_or_none() is not None:
        raise ValueError("EMAIL_EXISTS")

    rol = await _get_rol_by_name(db, data.rol)

    usuario = Usuario(
        nombre_completo=data.nombre_completo,
        email=data.email,
        password_hash=hash_password(data.password),
        activo=True,
        rol_id=rol.id,
        fecha_creacion=datetime.now(timezone.utc),
        fecha_actualizacion=datetime.now(timezone.utc),
    )
    db.add(usuario)
    await db.flush()

    # Create default preferences
    preferencias = PreferenciasUsuario(
        usuario_id=usuario.id,
        idioma="es",
        tema_visual="light",
        configuracion_regional="es-MX",
    )
    db.add(preferencias)
    await db.flush()

    return await _user_to_out(db, usuario)


async def update_usuario(
    db: AsyncSession, user_id: int, data: UserUpdateRequest
) -> Optional[UserOut]:
    """Update a user. Returns None if not found."""
    result = await db.execute(
        select(Usuario).options(selectinload(Usuario.rol)).where(Usuario.id == user_id)
    )
    usuario = result.scalar_one_or_none()
    if usuario is None:
        return None

    if data.nombre_completo is not None:
        usuario.nombre_completo = data.nombre_completo

    if data.email is not None:
        # Check uniqueness
        result = await db.execute(
            select(Usuario).where(Usuario.email == data.email, Usuario.id != user_id)
        )
        if result.scalar_one_or_none() is not None:
            raise ValueError("EMAIL_EXISTS")
        usuario.email = data.email

    if data.rol is not None:
        rol = await _get_rol_by_name(db, data.rol)
        usuario.rol_id = rol.id

    usuario.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()

    return await _user_to_out(db, usuario)


async def deactivate_usuario(
    db: AsyncSession, user_id: int, current_user_id: int
) -> Optional[UserOut]:
    """Deactivate a user. Cannot deactivate self."""
    if user_id == current_user_id:
        raise ValueError("CANNOT_DEACTIVATE_SELF")

    result = await db.execute(
        select(Usuario).options(selectinload(Usuario.rol)).where(Usuario.id == user_id)
    )
    usuario = result.scalar_one_or_none()
    if usuario is None:
        return None

    usuario.activo = False
    usuario.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()

    # Invalidate all sessions
    await invalidate_user_sessions(db, user_id)

    return await _user_to_out(db, usuario)


async def reactivate_usuario(
    db: AsyncSession, user_id: int
) -> Optional[UserOut]:
    """Reactivate a user."""
    result = await db.execute(
        select(Usuario).options(selectinload(Usuario.rol)).where(Usuario.id == user_id)
    )
    usuario = result.scalar_one_or_none()
    if usuario is None:
        return None

    usuario.activo = True
    usuario.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()

    return await _user_to_out(db, usuario)


# ─── Profile ────────────────────────────────────────────────────────────
async def get_perfil(
    db: AsyncSession, user_id: int
) -> Tuple[Optional[UserOut], Optional[PreferenciasOut]]:
    """Get user profile with preferences."""
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol), selectinload(Usuario.preferencias))
        .where(Usuario.id == user_id)
    )
    usuario = result.scalar_one_or_none()
    if usuario is None:
        return None, None

    user_out = await _user_to_out(db, usuario)

    pref = usuario.preferencias
    if pref:
        preferencias = PreferenciasOut(
            idioma=pref.idioma,
            tema_visual=pref.tema_visual,
            zona_horaria=pref.configuracion_regional,
        )
    else:
        preferencias = PreferenciasOut()

    return user_out, preferencias


async def update_perfil(
    db: AsyncSession, user_id: int, nombre_completo: Optional[str] = None, email: Optional[str] = None
) -> Optional[UserOut]:
    """Update user's own profile."""
    result = await db.execute(
        select(Usuario).options(selectinload(Usuario.rol)).where(Usuario.id == user_id)
    )
    usuario = result.scalar_one_or_none()
    if usuario is None:
        return None

    if nombre_completo is not None:
        usuario.nombre_completo = nombre_completo

    if email is not None:
        result = await db.execute(
            select(Usuario).where(Usuario.email == email, Usuario.id != user_id)
        )
        if result.scalar_one_or_none() is not None:
            raise ValueError("EMAIL_EXISTS")
        usuario.email = email

    usuario.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()

    return await _user_to_out(db, usuario)


async def change_password(
    db: AsyncSession,
    user_id: int,
    current_password: str,
    new_password: str,
) -> bool:
    """Change user password. Returns True if successful."""
    result = await db.execute(
        select(Usuario).where(Usuario.id == user_id)
    )
    usuario = result.scalar_one_or_none()
    if usuario is None:
        return False

    if not verify_password(current_password, usuario.password_hash):
        return False

    usuario.password_hash = hash_password(new_password)
    usuario.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()

    # Invalidate all sessions (force re-login)
    await invalidate_user_sessions(db, user_id)

    return True


async def get_preferencias(
    db: AsyncSession, user_id: int
) -> Optional[PreferenciasOut]:
    """Get user preferences."""
    result = await db.execute(
        select(PreferenciasUsuario).where(PreferenciasUsuario.usuario_id == user_id)
    )
    pref = result.scalar_one_or_none()

    if pref is None:
        # Create default preferences
        pref = PreferenciasUsuario(
            usuario_id=user_id,
            idioma="es",
            tema_visual="light",
            configuracion_regional="es-MX",
        )
        db.add(pref)
        await db.flush()

    return PreferenciasOut(
        idioma=pref.idioma,
        tema_visual=pref.tema_visual,
        zona_horaria=pref.configuracion_regional,
    )


async def update_preferencias(
    db: AsyncSession, user_id: int, data: PreferenciasUpdateRequest
) -> Optional[PreferenciasOut]:
    """Update user preferences."""
    result = await db.execute(
        select(PreferenciasUsuario).where(PreferenciasUsuario.usuario_id == user_id)
    )
    pref = result.scalar_one_or_none()

    if pref is None:
        pref = PreferenciasUsuario(usuario_id=user_id)
        db.add(pref)

    if data.idioma is not None:
        pref.idioma = data.idioma
    if data.tema_visual is not None:
        pref.tema_visual = data.tema_visual
    if data.zona_horaria is not None:
        pref.configuracion_regional = data.zona_horaria

    await db.flush()

    return PreferenciasOut(
        idioma=pref.idioma,
        tema_visual=pref.tema_visual,
        zona_horaria=pref.configuracion_regional,
    )
