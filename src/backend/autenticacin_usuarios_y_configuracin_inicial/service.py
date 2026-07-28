from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, attributes

from .models import (
    ConfiguracionNegocio,
    PreferenciasUsuario,
    Rol,
    TokenRestablecimiento,
    TokenSesion,
    Usuario,
)
from .schemas import UserOut, PreferenciasOut
from .utils import (
    hash_password,
    hash_token,
    verify_password,
    generate_token,
    get_token_expiry,
    get_reset_token_expiry,
    get_expires_in_seconds,
)

ROLES_PREDEFINIDOS = {
    "administrador": "Acceso completo a todas las funcionalidades del sistema",
    "vendedor": "Acceso al punto de venta, clientes y consulta de inventario",
    "almacen": "Acceso a inventario, órdenes de compra y productos",
}


async def ensure_roles_exist(db: AsyncSession) -> dict[str, Rol]:
    """Ensure the three predefined roles exist in the database. Return dict by name."""
    roles = {}
    for nombre, descripcion in ROLES_PREDEFINIDOS.items():
        result = await db.execute(select(Rol).where(Rol.nombre == nombre))
        rol = result.scalar_one_or_none()
        if rol is None:
            rol = Rol(nombre=nombre, descripcion=descripcion)
            db.add(rol)
        roles[nombre] = rol
    await db.flush()
    return roles


async def admin_exists(db: AsyncSession) -> bool:
    """Check if at least one admin user exists in the system."""
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .join(Rol, Usuario.rol_id == Rol.id)
        .where(Rol.nombre == "administrador")
        .limit(1)
    )
    return result.scalar_one_or_none() is not None


async def check_setup_completed(db: AsyncSession) -> bool:
    """Check if the setup wizard has been completed."""
    result = await db.execute(
        select(ConfiguracionNegocio).where(
            ConfiguracionNegocio.setup_completado == True
        ).limit(1)
    )
    config = result.scalar_one_or_none()
    return config is not None


async def _build_user_out(user: Usuario) -> UserOut:
    """Build a UserOut from a Usuario ORM object with safe relationship access."""
    rol_nombre = user.rol.nombre if user.rol else ""

    # Safely get ultimo_acceso from tokens_sesion
    ultimo_acceso = None
    if "tokens_sesion" not in attributes.instance_state(user).unloaded:
        active_tokens = [t for t in (user.tokens_sesion or []) if t.activo]
        if active_tokens:
            dates = [t.fecha_creacion for t in active_tokens if t.fecha_creacion]
            if dates:
                ultimo_acceso = max(dates)

    return UserOut(
        id=user.id,
        nombre_completo=user.nombre_completo,
        email=user.email,
        rol=rol_nombre,
        activo=user.activo,
        fecha_registro=user.fecha_creacion,
        ultimo_acceso=ultimo_acceso,
    )


async def _build_preferencias_out(prefs: PreferenciasUsuario) -> PreferenciasOut:
    """Build a PreferenciasOut from a PreferenciasUsuario ORM object."""
    return PreferenciasOut(
        idioma=prefs.idioma,
        tema_visual=prefs.tema_visual,
        zona_horaria=prefs.configuracion_regional,
    )


# ==== SETUP ====
async def run_setup(
    db: AsyncSession,
    nombre_completo: str,
    email: str,
    password: str,
    negocio_nombre: str,
    negocio_direccion: str,
    negocio_rfc: str,
    negocio_telefono: Optional[str] = None,
) -> tuple[Usuario, str]:
    """Run the initial setup wizard. Creates admin user + business config."""
    # Ensure roles exist
    roles = await ensure_roles_exist(db)
    admin_rol = roles["administrador"]

    # Create admin user
    pw_hash = hash_password(password)
    admin_user = Usuario(
        nombre_completo=nombre_completo,
        email=email,
        password_hash=pw_hash,
        activo=True,
        rol_id=admin_rol.id,
    )
    db.add(admin_user)
    await db.flush()
    await db.refresh(admin_user, ["rol", "preferencias", "tokens_sesion"])

    # Create default preferences for admin
    prefs = PreferenciasUsuario(usuario_id=admin_user.id)
    db.add(prefs)
    await db.flush()

    # Create business config
    config = ConfiguracionNegocio(
        nombre=negocio_nombre,
        direccion=negocio_direccion,
        datos_fiscales=negocio_rfc,
        telefono=negocio_telefono,
        email_contacto=email,
        setup_completado=True,
    )
    db.add(config)
    await db.flush()

    # Generate token for auto-login
    token_raw = generate_token()
    token_hash_val = hash_token(token_raw)
    expiry = get_token_expiry(remember=False)
    sesion = TokenSesion(
        usuario_id=admin_user.id,
        token_hash=token_hash_val,
        es_persistente=False,
        fecha_expiracion=expiry,
        activo=True,
    )
    db.add(sesion)
    await db.commit()

    return admin_user, token_raw


# ==== AUTH ====
async def authenticate_user(
    db: AsyncSession, email: str, password: str
) -> Optional[Usuario]:
    """Authenticate a user by email and password. Returns user or None."""
    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.tokens_sesion),
            selectinload(Usuario.preferencias),
        )
        .where(Usuario.email == email)
    )
    user = result.scalar_one_or_none()
    if user is None or not user.activo:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


async def create_session_token(
    db: AsyncSession, user: Usuario, remember: bool = False
) -> tuple[str, datetime]:
    """Create a session token for a user. Returns (raw_token, expiry)."""
    token_raw = generate_token()
    token_hash_val = hash_token(token_raw)
    expiry = get_token_expiry(remember=remember)
    sesion = TokenSesion(
        usuario_id=user.id,
        token_hash=token_hash_val,
        es_persistente=remember,
        fecha_expiracion=expiry,
        activo=True,
    )
    db.add(sesion)
    await db.flush()
    return token_raw, expiry


async def get_user_by_token(db: AsyncSession, token_raw: str) -> Optional[Usuario]:
    """Get a user by their session token. Returns None if invalid/expired."""
    token_hash_val = hash_token(token_raw)
    result = await db.execute(
        select(TokenSesion)
        .options(
            selectinload(TokenSesion.usuario).selectinload(Usuario.rol),
            selectinload(TokenSesion.usuario).selectinload(Usuario.tokens_sesion),
            selectinload(TokenSesion.usuario).selectinload(Usuario.preferencias),
        )
        .where(
            TokenSesion.token_hash == token_hash_val,
            TokenSesion.activo == True,
            TokenSesion.fecha_expiracion > datetime.now(timezone.utc),
        )
    )
    sesion = result.scalar_one_or_none()
    if sesion is None:
        return None
    user = sesion.usuario
    if not user.activo:
        return None
    return user


async def invalidate_session(db: AsyncSession, token_raw: str) -> bool:
    """Invalidate a session token."""
    token_hash_val = hash_token(token_raw)
    result = await db.execute(
        select(TokenSesion).where(TokenSesion.token_hash == token_hash_val)
    )
    sesion = result.scalar_one_or_none()
    if sesion is None:
        return False
    sesion.activo = False
    await db.flush()
    return True


async def invalidate_all_user_sessions(db: AsyncSession, user_id: int) -> None:
    """Invalidate all active sessions for a user."""
    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.usuario_id == user_id,
            TokenSesion.activo == True,
        )
    )
    sessions = result.scalars().all()
    for s in sessions:
        s.activo = False
    await db.flush()


# ==== PASSWORD RESET ====
async def create_reset_token(db: AsyncSession, email: str) -> Optional[str]:
    """Create a password reset token for a user. Returns raw token or None if user not found."""
    result = await db.execute(select(Usuario).where(Usuario.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        return None
    token_raw = generate_token()
    token_hash_val = hash_token(token_raw)
    expiry = get_reset_token_expiry()
    reset_token = TokenRestablecimiento(
        usuario_id=user.id,
        token_hash=token_hash_val,
        fecha_expiracion=expiry,
        utilizado=False,
    )
    db.add(reset_token)
    await db.flush()
    return token_raw


async def verify_reset_token(db: AsyncSession, token_raw: str) -> Optional[Usuario]:
    """Verify a reset token. Returns user if valid, None otherwise."""
    token_hash_val = hash_token(token_raw)
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(TokenRestablecimiento)
        .options(selectinload(TokenRestablecimiento.usuario))
        .where(
            TokenRestablecimiento.token_hash == token_hash_val,
            TokenRestablecimiento.utilizado == False,
            TokenRestablecimiento.fecha_expiracion > now,
        )
    )
    reset_token = result.scalar_one_or_none()
    if reset_token is None:
        return None
    return reset_token.usuario


async def use_reset_token(db: AsyncSession, token_raw: str, new_password: str) -> bool:
    """Mark a reset token as used and update the user's password."""
    token_hash_val = hash_token(token_raw)
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(TokenRestablecimiento)
        .options(selectinload(TokenRestablecimiento.usuario))
        .where(
            TokenRestablecimiento.token_hash == token_hash_val,
            TokenRestablecimiento.utilizado == False,
            TokenRestablecimiento.fecha_expiracion > now,
        )
    )
    reset_token = result.scalar_one_or_none()
    if reset_token is None:
        return False
    user = reset_token.usuario
    user.password_hash = hash_password(new_password)
    reset_token.utilizado = True
    await db.flush()
    return True


# ==== USER MANAGEMENT ====
async def list_usuarios(
    db: AsyncSession,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[Usuario], int]:
    """List users with optional search and pagination."""
    query = select(Usuario).options(
        selectinload(Usuario.rol),
        selectinload(Usuario.tokens_sesion),
        selectinload(Usuario.preferencias),
    )

    count_query = select(func.count(Usuario.id))

    if search:
        search_pattern = f"%{search}%"
        query = query.where(Usuario.nombre_completo.ilike(search_pattern))
        count_query = count_query.where(Usuario.nombre_completo.ilike(search_pattern))

    # Get total count
    result = await db.execute(count_query)
    total = result.scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Usuario.id)

    result = await db.execute(query)
    users = list(result.scalars().all())

    return users, total


async def get_usuario_by_id(db: AsyncSession, user_id: int) -> Optional[Usuario]:
    """Get a user by ID with all relationships loaded."""
    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.tokens_sesion),
            selectinload(Usuario.preferencias),
        )
        .where(Usuario.id == user_id)
    )
    return result.scalar_one_or_none()


async def get_usuario_by_email(db: AsyncSession, email: str) -> Optional[Usuario]:
    """Get a user by email."""
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


async def create_usuario(
    db: AsyncSession,
    nombre_completo: str,
    email: str,
    password: str,
    rol_nombre: str,
) -> Usuario:
    """Create a new user."""
    # Ensure roles exist
    roles = await ensure_roles_exist(db)
    rol = roles.get(rol_nombre)
    if rol is None:
        raise ValueError(f"Rol '{rol_nombre}' no es válido")

    pw_hash = hash_password(password)
    user = Usuario(
        nombre_completo=nombre_completo,
        email=email,
        password_hash=pw_hash,
        activo=True,
        rol_id=rol.id,
    )
    db.add(user)
    await db.flush()

    # Create default preferences
    prefs = PreferenciasUsuario(usuario_id=user.id)
    db.add(prefs)
    await db.flush()

    await db.refresh(user, ["rol", "preferencias", "tokens_sesion"])
    return user


async def update_usuario(
    db: AsyncSession,
    user: Usuario,
    nombre_completo: Optional[str] = None,
    email: Optional[str] = None,
    rol_nombre: Optional[str] = None,
) -> Usuario:
    """Update user fields."""
    if nombre_completo is not None:
        user.nombre_completo = nombre_completo
    if email is not None:
        user.email = email
    if rol_nombre is not None:
        roles = await ensure_roles_exist(db)
        rol = roles.get(rol_nombre)
        if rol is None:
            raise ValueError(f"Rol '{rol_nombre}' no es válido")
        user.rol_id = rol.id
    user.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(user, ["rol", "preferencias", "tokens_sesion"])
    return user


async def deactivate_usuario(db: AsyncSession, user: Usuario) -> Usuario:
    """Deactivate a user and invalidate all their sessions."""
    user.activo = False
    user.fecha_actualizacion = datetime.now(timezone.utc)
    await invalidate_all_user_sessions(db, user.id)
    await db.flush()
    await db.refresh(user, ["rol", "preferencias", "tokens_sesion"])
    return user


async def reactivate_usuario(db: AsyncSession, user: Usuario) -> Usuario:
    """Reactivate a user."""
    user.activo = True
    user.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(user, ["rol", "preferencias", "tokens_sesion"])
    return user


# ==== PREFERENCIAS ====
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
    configuracion_regional: Optional[str] = None,
) -> PreferenciasUsuario:
    """Update user preferences."""
    prefs = await get_preferencias(db, user_id)
    if prefs is None:
        prefs = PreferenciasUsuario(usuario_id=user_id)
        db.add(prefs)
        await db.flush()

    if idioma is not None:
        prefs.idioma = idioma
    if tema_visual is not None:
        prefs.tema_visual = tema_visual
    if configuracion_regional is not None:
        prefs.configuracion_regional = configuracion_regional

    await db.flush()
    return prefs


# ==== CHANGE PASSWORD ====
async def change_password(
    db: AsyncSession, user: Usuario, current_password: str, new_password: str
) -> bool:
    """Change user password. Returns False if current password is wrong."""
    if not verify_password(current_password, user.password_hash):
        return False
    user.password_hash = hash_password(new_password)
    user.fecha_actualizacion = datetime.now(timezone.utc)
    # Invalidate all sessions for this user (force re-login)
    await invalidate_all_user_sessions(db, user.id)
    await db.flush()
    return True
