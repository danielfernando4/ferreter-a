import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .models import (
    ConfiguracionNegocio,
    PreferenciasUsuario,
    Rol,
    TokenRestablecimiento,
    TokenSesion,
    Usuario,
)
from .schemas import (
    SetupRequest,
    UserCreateRequest,
    UserUpdateRequest,
    PreferenciasUpdateRequest,
    ChangePasswordRequest,
)
from .utils import (
    create_jwt_token,
    decode_jwt_token,
    generate_random_token,
    hash_password,
    hash_token,
    verify_password,
    get_token_expires_in,
)


# ─── Roles ──────────────────────────────────────────────────────────────

ROLES_PREDEFINIDOS = {
    "administrador": "Acceso completo a todas las funcionalidades del sistema",
    "vendedor": "Acceso al punto de venta, clientes y consulta de inventario",
    "almacen": "Acceso a inventario, órdenes de compra y productos",
}

ROLES_VALIDOS = set(ROLES_PREDEFINIDOS.keys())


async def ensure_roles_exist(db: AsyncSession):
    """Create predefined roles if they don't exist."""
    for nombre, descripcion in ROLES_PREDEFINIDOS.items():
        result = await db.execute(select(Rol).where(Rol.nombre == nombre))
        rol = result.scalar_one_or_none()
        if rol is None:
            db.add(Rol(nombre=nombre, descripcion=descripcion))
    await db.commit()


async def get_rol_by_name(db: AsyncSession, nombre: str) -> Rol | None:
    result = await db.execute(select(Rol).where(Rol.nombre == nombre))
    return result.scalar_one_or_none()


# ─── Setup ──────────────────────────────────────────────────────────────

async def check_setup_status(db: AsyncSession) -> dict:
    """Check if setup has been completed and if an admin exists."""
    result = await db.execute(
        select(ConfiguracionNegocio).where(ConfiguracionNegocio.setup_completado == True)
    )
    config = result.scalar_one_or_none()

    result2 = await db.execute(
        select(Usuario)
        .join(Rol)
        .where(Rol.nombre == "administrador")
        .limit(1)
    )
    admin = result2.scalar_one_or_none()

    return {
        "setup_completed": config is not None,
        "admin_exists": admin is not None,
    }


async def run_setup(db: AsyncSession, data: SetupRequest) -> dict:
    """Run the initial setup wizard: create admin user and business config."""
    # Check if setup already completed
    result = await db.execute(
        select(ConfiguracionNegocio).where(ConfiguracionNegocio.setup_completado == True)
    )
    if result.scalar_one_or_none():
        raise ValueError("SETUP_ALREADY_COMPLETED")

    # Ensure roles exist
    await ensure_roles_exist(db)

    # Get admin rol
    admin_rol = await get_rol_by_name(db, "administrador")
    if admin_rol is None:
        raise ValueError("INVALID_DATA")

    # Check if email already exists
    result = await db.execute(select(Usuario).where(Usuario.email == data.email))
    if result.scalar_one_or_none():
        raise ValueError("EMAIL_EXISTS")

    # Create admin user
    usuario = Usuario(
        nombre_completo=data.nombre_completo,
        email=data.email,
        password_hash=hash_password(data.password),
        activo=True,
        rol_id=admin_rol.id,
    )
    db.add(usuario)
    await db.flush()

    # Create default preferences
    preferencias = PreferenciasUsuario(usuario_id=usuario.id)
    db.add(preferencias)

    # Create business config
    config = ConfiguracionNegocio(
        nombre=data.negocio_nombre,
        direccion=data.negocio_direccion,
        datos_fiscales=data.negocio_rfc,
        telefono=data.negocio_telefono,
        email_contacto=data.email,
        setup_completado=True,
    )
    db.add(config)
    await db.commit()
    await db.refresh(usuario)

    # Reload with relationship for schema serialization
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.id == usuario.id)
    )
    usuario = result.scalar_one()

    return {"usuario": usuario}


# ─── Authentication ────────────────────────────────────────────────────

async def authenticate_user(db: AsyncSession, email: str, password: str) -> dict | None:
    """Authenticate a user. Returns token info or None."""
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.email == email, Usuario.activo == True)
    )
    usuario = result.scalar_one_or_none()

    if usuario is None:
        return None

    if not verify_password(password, usuario.password_hash):
        return None

    # Update ultimo_acceso
    usuario.ultimo_acceso = datetime.now(timezone.utc)
    await db.commit()

    return {"usuario": usuario}


async def create_session_token(db: AsyncSession, usuario_id: int, remember: bool = False) -> str:
    """Create a JWT token and store session record."""
    # Get user info for token
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.id == usuario_id)
    )
    usuario = result.scalar_one()

    # Create JWT
    token = create_jwt_token(usuario.id, usuario.email, usuario.rol.nombre, remember)

    # Store token hash in DB
    if remember:
        expire_days = 30
    else:
        expire_minutes = 60
        expire_days = 0

    if remember:
        expire = datetime.now(timezone.utc) + timedelta(days=expire_days)
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)

    token_hash = hash_token(token)
    token_sesion = TokenSesion(
        usuario_id=usuario_id,
        token_hash=token_hash,
        es_persistente=remember,
        fecha_expiracion=expire,
    )
    db.add(token_sesion)
    await db.commit()

    return token


async def invalidate_token(db: AsyncSession, token: str):
    """Invalidate a session token."""
    token_hash = hash_token(token)
    result = await db.execute(select(TokenSesion).where(TokenSesion.token_hash == token_hash))
    token_sesion = result.scalar_one_or_none()
    if token_sesion:
        token_sesion.activo = False
        await db.commit()


async def invalidate_all_user_tokens(db: AsyncSession, usuario_id: int):
    """Invalidate all active tokens for a user."""
    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.usuario_id == usuario_id,
            TokenSesion.activo == True,
        )
    )
    tokens = result.scalars().all()
    for t in tokens:
        t.activo = False
    await db.commit()


# ─── User Management ────────────────────────────────────────────────────

async def get_usuario_by_id(db: AsyncSession, usuario_id: int) -> Usuario | None:
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.id == usuario_id)
    )
    return result.scalar_one_or_none()


async def get_usuario_by_email(db: AsyncSession, email: str) -> Usuario | None:
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.email == email)
    )
    return result.scalar_one_or_none()


async def list_usuarios(
    db: AsyncSession,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
) -> dict:
    """List users with optional search and pagination."""
    query = select(Usuario).options(selectinload(Usuario.rol))

    if search:
        query = query.where(
            Usuario.nombre_completo.ilike(f"%{search}%")
            | Usuario.email.ilike(f"%{search}%")
        )

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    query = query.order_by(Usuario.fecha_creacion.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    usuarios = result.scalars().all()

    total_pages = max(1, (total + page_size - 1) // page_size)

    return {
        "items": list(usuarios),
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


async def create_usuario(db: AsyncSession, data: UserCreateRequest, admin_id: int) -> Usuario:
    """Create a new user (admin only)."""
    # Validate rol
    if data.rol not in ROLES_VALIDOS:
        raise ValueError("INVALID_ROLE")

    # Check email uniqueness
    existing = await get_usuario_by_email(db, data.email)
    if existing:
        raise ValueError("EMAIL_EXISTS")

    rol = await get_rol_by_name(db, data.rol)
    if rol is None:
        raise ValueError("INVALID_ROLE")

    usuario = Usuario(
        nombre_completo=data.nombre_completo,
        email=data.email,
        password_hash=hash_password(data.password),
        activo=True,
        rol_id=rol.id,
    )
    db.add(usuario)
    await db.flush()

    # Create default preferences
    preferencias = PreferenciasUsuario(usuario_id=usuario.id)
    db.add(preferencias)
    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.id == usuario.id)
    )
    return result.scalar_one()


async def update_usuario(db: AsyncSession, usuario_id: int, data: UserUpdateRequest) -> Usuario:
    """Update an existing user (admin only)."""
    usuario = await get_usuario_by_id(db, usuario_id)
    if usuario is None:
        raise ValueError("NOT_FOUND")

    if data.nombre_completo is not None:
        usuario.nombre_completo = data.nombre_completo

    if data.email is not None:
        # Check email uniqueness (exclude current user)
        existing = await get_usuario_by_email(db, data.email)
        if existing and existing.id != usuario_id:
            raise ValueError("EMAIL_EXISTS")
        usuario.email = data.email

    if data.rol is not None:
        if data.rol not in ROLES_VALIDOS:
            raise ValueError("INVALID_ROLE")
        rol = await get_rol_by_name(db, data.rol)
        if rol is None:
            raise ValueError("INVALID_ROLE")
        usuario.rol_id = rol.id
        # Invalidate all tokens for this user on role change
        await invalidate_all_user_tokens(db, usuario_id)

    usuario.fecha_actualizacion = datetime.now(timezone.utc)
    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.id == usuario_id)
    )
    return result.scalar_one()


async def deactivate_usuario(db: AsyncSession, usuario_id: int, admin_id: int) -> Usuario:
    """Deactivate a user. Cannot deactivate yourself."""
    if usuario_id == admin_id:
        raise ValueError("CANNOT_DEACTIVATE_SELF")

    usuario = await get_usuario_by_id(db, usuario_id)
    if usuario is None:
        raise ValueError("NOT_FOUND")

    usuario.activo = False
    usuario.fecha_actualizacion = datetime.now(timezone.utc)
    await db.commit()

    # Invalidate all tokens
    await invalidate_all_user_tokens(db, usuario_id)

    # Reload
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.id == usuario_id)
    )
    return result.scalar_one()


async def reactivate_usuario(db: AsyncSession, usuario_id: int) -> Usuario:
    """Reactivate a deactivated user."""
    usuario = await get_usuario_by_id(db, usuario_id)
    if usuario is None:
        raise ValueError("NOT_FOUND")

    usuario.activo = True
    usuario.fecha_actualizacion = datetime.now(timezone.utc)
    await db.commit()

    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.id == usuario_id)
    )
    return result.scalar_one()


# ─── Profile ────────────────────────────────────────────────────────────

async def update_profile(db: AsyncSession, usuario_id: int, nombre_completo: Optional[str] = None, email: Optional[str] = None) -> Usuario:
    """Update user profile."""
    usuario = await get_usuario_by_id(db, usuario_id)
    if usuario is None:
        raise ValueError("NOT_FOUND")

    if nombre_completo is not None:
        usuario.nombre_completo = nombre_completo

    if email is not None:
        existing = await get_usuario_by_email(db, email)
        if existing and existing.id != usuario_id:
            raise ValueError("EMAIL_EXISTS")
        usuario.email = email

    usuario.fecha_actualizacion = datetime.now(timezone.utc)
    await db.commit()

    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.id == usuario_id)
    )
    return result.scalar_one()


async def change_password(db: AsyncSession, usuario_id: int, data: ChangePasswordRequest) -> str:
    """Change user password."""
    if data.new_password != data.confirm_password:
        raise ValueError("PASSWORDS_DONT_MATCH")

    if len(data.new_password) < 6:
        raise ValueError("PASSWORD_TOO_SHORT")

    usuario = await get_usuario_by_id(db, usuario_id)
    if usuario is None:
        raise ValueError("NOT_FOUND")

    if not verify_password(data.current_password, usuario.password_hash):
        raise ValueError("INVALID_CURRENT_PASSWORD")

    usuario.password_hash = hash_password(data.new_password)
    usuario.fecha_actualizacion = datetime.now(timezone.utc)
    await db.commit()

    # Invalidate all other tokens except current session
    await invalidate_all_user_tokens(db, usuario_id)

    return "Contraseña actualizada exitosamente"


# ─── Preferences ────────────────────────────────────────────────────────

async def get_preferencias(db: AsyncSession, usuario_id: int) -> PreferenciasUsuario | None:
    result = await db.execute(
        select(PreferenciasUsuario).where(PreferenciasUsuario.usuario_id == usuario_id)
    )
    return result.scalar_one_or_none()


async def update_preferencias(db: AsyncSession, usuario_id: int, data: PreferenciasUpdateRequest) -> PreferenciasUsuario:
    """Update user preferences."""
    preferencias = await get_preferencias(db, usuario_id)
    if preferencias is None:
        # Create if not exists
        preferencias = PreferenciasUsuario(usuario_id=usuario_id)
        db.add(preferencias)

    if data.idioma is not None:
        preferencias.idioma = data.idioma
    if data.tema_visual is not None:
        preferencias.tema_visual = data.tema_visual
    if data.zona_horaria is not None:
        preferencias.configuracion_regional = data.zona_horaria

    await db.commit()
    await db.refresh(preferencias)
    return preferencias


# ─── Password Reset ─────────────────────────────────────────────────────

async def create_reset_token(db: AsyncSession, email: str) -> str | None:
    """Create a password reset token. Returns None if email not found (silent)."""
    result = await db.execute(select(Usuario).where(Usuario.email == email))
    usuario = result.scalar_one_or_none()

    if usuario is None:
        return None

    # Invalidate any existing unused tokens
    result = await db.execute(
        select(TokenRestablecimiento).where(
            TokenRestablecimiento.usuario_id == usuario.id,
            TokenRestablecimiento.utilizado == False,
        )
    )
    old_tokens = result.scalars().all()
    for t in old_tokens:
        t.utilizado = True

    # Create new token
    token = generate_random_token()
    token_hash_obj = TokenRestablecimiento(
        usuario_id=usuario.id,
        token_hash=hash_token(token),
        fecha_expiracion=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    db.add(token_hash_obj)
    await db.commit()

    return token


async def verify_reset_token(db: AsyncSession, token: str) -> dict:
    """Verify a reset token. Returns dict with valido, email, and expired status."""
    token_hash_value = hash_token(token)
    result = await db.execute(
        select(TokenRestablecimiento).where(
            TokenRestablecimiento.token_hash == token_hash_value,
            TokenRestablecimiento.utilizado == False,
        )
    )
    token_obj = result.scalar_one_or_none()

    if token_obj is None:
        return {"valido": False, "email": "", "expired": False}

    if datetime.now(timezone.utc) > token_obj.fecha_expiracion:
        return {"valido": False, "email": "", "expired": True}

    # Get user email
    result2 = await db.execute(select(Usuario).where(Usuario.id == token_obj.usuario_id))
    usuario = result2.scalar_one()

    return {"valido": True, "email": usuario.email, "expired": False}


async def reset_password(db: AsyncSession, token: str, new_password: str, confirm_password: str) -> str:
    """Reset password using a reset token."""
    if new_password != confirm_password:
        raise ValueError("PASSWORDS_DONT_MATCH")

    if len(new_password) < 6:
        raise ValueError("PASSWORD_TOO_SHORT")

    token_hash_value = hash_token(token)
    result = await db.execute(
        select(TokenRestablecimiento).where(
            TokenRestablecimiento.token_hash == token_hash_value,
            TokenRestablecimiento.utilizado == False,
        )
    )
    token_obj = result.scalar_one_or_none()

    if token_obj is None:
        raise ValueError("TOKEN_INVALID_OR_EXPIRED")

    if datetime.now(timezone.utc) > token_obj.fecha_expiracion:
        token_obj.utilizado = True
        await db.commit()
        raise ValueError("TOKEN_INVALID_OR_EXPIRED")

    # Update password
    result2 = await db.execute(select(Usuario).where(Usuario.id == token_obj.usuario_id))
    usuario = result2.scalar_one()
    usuario.password_hash = hash_password(new_password)
    usuario.fecha_actualizacion = datetime.now(timezone.utc)

    # Invalidate token
    token_obj.utilizado = True
    await db.commit()

    # Invalidate all session tokens for this user
    await invalidate_all_user_tokens(db, usuario.id)

    return "Contraseña restablecida exitosamente"


# ─── Profile with Preferences ──────────────────────────────────────────

async def get_perfil_completo(db: AsyncSession, usuario_id: int) -> dict:
    """Get user profile with preferences."""
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.id == usuario_id)
    )
    usuario = result.scalar_one_or_none()
    if usuario is None:
        raise ValueError("NOT_FOUND")

    preferencias = await get_preferencias(db, usuario_id)
    if preferencias is None:
        preferencias = PreferenciasUsuario(usuario_id=usuario_id)
        db.add(preferencias)
        await db.commit()
        await db.refresh(preferencias)

    return {"usuario": usuario, "preferencias": preferencias}
