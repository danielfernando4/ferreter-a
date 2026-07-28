from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from autenticacin_usuarios_y_configuracin_inicial.models import (
    ConfiguracionNegocio,
    PreferenciasUsuario,
    Rol,
    TokenRestablecimiento,
    TokenSesion,
    Usuario,
)
from autenticacin_usuarios_y_configuracin_inicial.utils import (
    generate_token,
    get_token_expiry,
    hash_password,
    hash_token,
    verify_password,
)

ROLES_PREDEFINIDOS = {
    "administrador": "Acceso completo a todas las funcionalidades del sistema.",
    "vendedor": "Acceso al módulo de Punto de Venta y consulta de inventario.",
    "almacen": "Acceso al módulo de inventario, órdenes de compra y productos.",
}


# ─── Setup / Configuración Inicial ──────────────────────────────────────────

async def check_setup_status(db: AsyncSession) -> Tuple[bool, bool]:
    """Check if setup is completed and if an admin exists."""
    result = await db.execute(select(ConfiguracionNegocio).limit(1))
    config = result.scalar_one_or_none()
    setup_completed = config.setup_completado if config else False

    result = await db.execute(
        select(Usuario).join(Rol).where(Rol.nombre == "administrador").limit(1)
    )
    admin = result.scalar_one_or_none()
    admin_exists = admin is not None
    return setup_completed, admin_exists


async def run_setup(
    db: AsyncSession,
    nombre_completo: str,
    email: str,
    password: str,
    negocio_nombre: str,
    negocio_direccion: str,
    negocio_rfc: str,
    negocio_telefono: Optional[str] = None,
) -> Usuario:
    """Run the initial setup wizard: create admin user and business config."""
    # Create default roles if they don't exist
    for rol_nombre, rol_desc in ROLES_PREDEFINIDOS.items():
        result = await db.execute(select(Rol).where(Rol.nombre == rol_nombre))
        existing = result.scalar_one_or_none()
        if not existing:
            db.add(Rol(nombre=rol_nombre, descripcion=rol_desc))

    await db.flush()

    # Get admin role
    result = await db.execute(select(Rol).where(Rol.nombre == "administrador"))
    admin_rol = result.scalar_one()

    # Create admin user
    password_hash_value = hash_password(password)
    admin = Usuario(
        nombre_completo=nombre_completo,
        email=email,
        password_hash=password_hash_value,
        activo=True,
        rol_id=admin_rol.id,
    )
    db.add(admin)
    await db.flush()

    # Create default preferences for admin
    pref = PreferenciasUsuario(
        usuario_id=admin.id,
        idioma="es",
        tema_visual="light",
        configuracion_regional="America/Mexico_City",
    )
    db.add(pref)

    # Create or update business config
    result = await db.execute(select(ConfiguracionNegocio).limit(1))
    config = result.scalar_one_or_none()
    if config:
        config.nombre = negocio_nombre
        config.direccion = negocio_direccion
        config.datos_fiscales = negocio_rfc
        config.telefono = negocio_telefono
        config.setup_completado = True
    else:
        config = ConfiguracionNegocio(
            nombre=negocio_nombre,
            direccion=negocio_direccion,
            datos_fiscales=negocio_rfc,
            telefono=negocio_telefono,
            setup_completado=True,
        )
        db.add(config)

    await db.commit()
    await db.refresh(admin)
    return admin


# ─── Autenticación ──────────────────────────────────────────────────────────

async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[Usuario]:
    """Verify credentials and return user if valid."""
    result = await db.execute(
        select(Usuario).where(
            Usuario.email == email,
            Usuario.activo == True,  # noqa: E712
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


async def create_session_token(db: AsyncSession, user: Usuario, persistent: bool = False) -> str:
    """Create a new session token for the user."""
    token = generate_token()
    token_hash_value = hash_token(token)
    expiry = get_token_expiry(persistent)

    session = TokenSesion(
        usuario_id=user.id,
        token_hash=token_hash_value,
        es_persistente=persistent,
        fecha_expiracion=expiry,
        activo=True,
    )
    db.add(session)

    # Update last access
    user.ultimo_acceso = datetime.now(timezone.utc)
    await db.commit()
    return token


async def get_user_by_token(db: AsyncSession, raw_token: str) -> Optional[Usuario]:
    """Get user from a session token."""
    token_hash_value = hash_token(raw_token)
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.token_hash == token_hash_value,
            TokenSesion.activo == True,  # noqa: E712
            TokenSesion.fecha_expiracion > now,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        return None
    result = await db.execute(
        select(Usuario).where(Usuario.id == session.usuario_id)
    )
    user = result.scalar_one_or_none()
    return user


async def invalidate_token(db: AsyncSession, raw_token: str) -> None:
    """Invalidate a session token."""
    token_hash_value = hash_token(raw_token)
    result = await db.execute(
        select(TokenSesion).where(TokenSesion.token_hash == token_hash_value)
    )
    session = result.scalar_one_or_none()
    if session:
        session.activo = False
        await db.commit()


async def invalidate_all_user_tokens(db: AsyncSession, user_id: int) -> None:
    """Invalidate all active tokens for a user."""
    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.usuario_id == user_id,
            TokenSesion.activo == True,  # noqa: E712
        )
    )
    sessions = result.scalars().all()
    for session in sessions:
        session.activo = False
    await db.commit()


# ─── Recuperación de Contraseña ─────────────────────────────────────────────

async def create_reset_token(db: AsyncSession, email: str) -> Optional[str]:
    """Create a password reset token for the user. Returns None if email not found."""
    result = await db.execute(select(Usuario).where(Usuario.email == email))
    user = result.scalar_one_or_none()
    if not user:
        return None

    token = generate_token()
    token_hash_value = hash_token(token)
    expiry = datetime.now(timezone.utc)

    from datetime import timedelta
    expiry += timedelta(hours=1)

    reset = TokenRestablecimiento(
        usuario_id=user.id,
        token_hash=token_hash_value,
        fecha_expiracion=expiry,
        utilizado=False,
    )
    db.add(reset)
    await db.commit()
    return token


async def verify_reset_token(db: AsyncSession, raw_token: str) -> Optional[str]:
    """Verify a reset token and return the associated email. Returns None if invalid."""
    token_hash_value = hash_token(raw_token)
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(TokenRestablecimiento).where(
            TokenRestablecimiento.token_hash == token_hash_value,
            TokenRestablecimiento.utilizado == False,  # noqa: E712
            TokenRestablecimiento.fecha_expiracion > now,
        )
    )
    reset = result.scalar_one_or_none()
    if not reset:
        return None
    result = await db.execute(
        select(Usuario).where(Usuario.id == reset.usuario_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        return None
    return user.email


async def reset_password(db: AsyncSession, raw_token: str, new_password: str) -> bool:
    """Reset a user's password using a valid reset token."""
    token_hash_value = hash_token(raw_token)
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(TokenRestablecimiento).where(
            TokenRestablecimiento.token_hash == token_hash_value,
            TokenRestablecimiento.utilizado == False,  # noqa: E712
            TokenRestablecimiento.fecha_expiracion > now,
        )
    )
    reset = result.scalar_one_or_none()
    if not reset:
        return False

    result = await db.execute(
        select(Usuario).where(Usuario.id == reset.usuario_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        return False

    user.password_hash = hash_password(new_password)
    reset.utilizado = True
    await invalidate_all_user_tokens(db, user.id)
    await db.commit()
    return True


# ─── Gestión de Usuarios ────────────────────────────────────────────────────

async def list_usuarios(
    db: AsyncSession,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
) -> Tuple[List[Usuario], int]:
    """List users with pagination and optional search."""
    query = select(Usuario).join(Rol)

    if search:
        query = query.where(
            or_(
                Usuario.nombre_completo.ilike(f"%{search}%"),
                Usuario.email.ilike(f"%{search}%"),
            )
        )

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.order_by(Usuario.fecha_creacion.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    users = list(result.scalars().all())

    return users, total


async def get_usuario_by_id(db: AsyncSession, user_id: int) -> Optional[Usuario]:
    """Get a single user by ID."""
    result = await db.execute(
        select(Usuario).where(Usuario.id == user_id)
    )
    return result.scalar_one_or_none()


async def get_usuario_by_email(db: AsyncSession, email: str) -> Optional[Usuario]:
    """Get a user by email."""
    result = await db.execute(
        select(Usuario).where(Usuario.email == email)
    )
    return result.scalar_one_or_none()


async def create_usuario(
    db: AsyncSession,
    nombre_completo: str,
    email: str,
    password: str,
    rol_nombre: str,
) -> Usuario:
    """Create a new user."""
    password_hash_value = hash_password(password)
    result = await db.execute(select(Rol).where(Rol.nombre == rol_nombre))
    rol = result.scalar_one()

    user = Usuario(
        nombre_completo=nombre_completo,
        email=email,
        password_hash=password_hash_value,
        activo=True,
        rol_id=rol.id,
    )
    db.add(user)
    await db.flush()

    # Create default preferences
    pref = PreferenciasUsuario(
        usuario_id=user.id,
        idioma="es",
        tema_visual="light",
        configuracion_regional="America/Mexico_City",
    )
    db.add(pref)
    await db.commit()
    await db.refresh(user)
    return user


async def update_usuario(
    db: AsyncSession,
    user_id: int,
    nombre_completo: Optional[str] = None,
    email: Optional[str] = None,
    rol_nombre: Optional[str] = None,
) -> Optional[Usuario]:
    """Update a user's details."""
    user = await get_usuario_by_id(db, user_id)
    if not user:
        return None

    if nombre_completo is not None:
        user.nombre_completo = nombre_completo
    if email is not None:
        user.email = email
    if rol_nombre is not None:
        result = await db.execute(select(Rol).where(Rol.nombre == rol_nombre))
        rol = result.scalar_one()
        user.rol_id = rol.id
        # Invalidate tokens on role change
        await invalidate_all_user_tokens(db, user.id)

    await db.commit()
    await db.refresh(user)
    return user


async def deactivate_usuario(db: AsyncSession, user_id: int) -> Optional[Usuario]:
    """Deactivate a user."""
    user = await get_usuario_by_id(db, user_id)
    if not user:
        return None
    user.activo = False
    await invalidate_all_user_tokens(db, user_id)
    await db.commit()
    await db.refresh(user)
    return user


async def reactivate_usuario(db: AsyncSession, user_id: int) -> Optional[Usuario]:
    """Reactivate a user."""
    user = await get_usuario_by_id(db, user_id)
    if not user:
        return None
    user.activo = True
    await db.commit()
    await db.refresh(user)
    return user


# ─── Perfil y Preferencias ──────────────────────────────────────────────────

async def get_preferencias(db: AsyncSession, user_id: int) -> Optional[PreferenciasUsuario]:
    """Get user preferences."""
    result = await db.execute(
        select(PreferenciasUsuario).where(PreferenciasUsuario.usuario_id == user_id)
    )
    return result.scalar_one_or_none()


async def update_preferencias(
    db: AsyncSession,
    user_id: int,
    idioma: Optional[str] = None,
    tema_visual: Optional[str] = None,
    zona_horaria: Optional[str] = None,
) -> Optional[PreferenciasUsuario]:
    """Update user preferences."""
    pref = await get_preferencias(db, user_id)
    if not pref:
        return None

    if idioma is not None:
        pref.idioma = idioma
    if tema_visual is not None:
        pref.tema_visual = tema_visual
    if zona_horaria is not None:
        pref.configuracion_regional = zona_horaria

    await db.commit()
    await db.refresh(pref)
    return pref


async def change_user_password(
    db: AsyncSession, user: Usuario, current_password: str, new_password: str
) -> bool:
    """Change a user's password after verifying current password."""
    if not verify_password(current_password, user.password_hash):
        return False
    user.password_hash = hash_password(new_password)
    await invalidate_all_user_tokens(db, user.id)
    await db.commit()
    return True


async def update_perfil(
    db: AsyncSession,
    user_id: int,
    nombre_completo: Optional[str] = None,
    email: Optional[str] = None,
) -> Optional[Usuario]:
    """Update user's own profile."""
    user = await get_usuario_by_id(db, user_id)
    if not user:
        return None
    if nombre_completo is not None:
        user.nombre_completo = nombre_completo
    if email is not None:
        user.email = email
    await db.commit()
    await db.refresh(user)
    return user
