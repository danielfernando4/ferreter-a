from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

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
    get_reset_token_expiry,
    get_token_expiry,
    hash_password,
    hash_token,
    verify_password,
)

ROLES_PREDEFINIDOS = {
    "administrador": "Acceso completo a todas las funcionalidades del sistema",
    "vendedor": "Acceso al punto de venta y consulta de inventario",
    "almacen": "Acceso a inventario, órdenes de compra y catálogo de productos",
}


# ─── Setup ──────────────────────────────────────────────────
async def check_setup_status(db: AsyncSession) -> Tuple[bool, bool]:
    """Check if setup is completed and if any admin exists."""
    result = await db.execute(select(ConfiguracionNegocio).limit(1))
    config = result.scalar_one_or_none()

    setup_completed = config is not None and config.setup_completado

    result = await db.execute(
        select(Usuario)
        .join(Rol)
        .where(Rol.nombre == "administrador", Usuario.activo == True)
        .limit(1)
    )
    admin = result.scalar_one_or_none()
    admin_exists = admin is not None

    return setup_completed, admin_exists


async def run_setup(db: AsyncSession, data: dict) -> Usuario:
    """Execute initial setup: create roles, admin user, and business config."""
    # Create roles if they don't exist
    for nombre, descripcion in ROLES_PREDEFINIDOS.items():
        result = await db.execute(select(Rol).where(Rol.nombre == nombre))
        existing = result.scalar_one_or_none()
        if existing is None:
            rol = Rol(nombre=nombre, descripcion=descripcion)
            db.add(rol)
    await db.commit()

    # Get admin role
    result = await db.execute(select(Rol).where(Rol.nombre == "administrador"))
    admin_rol = result.scalar_one()

    # Create admin user
    usuario = Usuario(
        nombre_completo=data["nombre_completo"],
        email=data["email"],
        password_hash=hash_password(data["password"]),
        activo=True,
        rol_id=admin_rol.id,
    )
    db.add(usuario)
    await db.commit()
    await db.refresh(usuario)

    # Create default preferences
    preferencias = PreferenciasUsuario(usuario_id=usuario.id)
    db.add(preferencias)

    # Create business config
    config = ConfiguracionNegocio(
        nombre=data["negocio_nombre"],
        direccion=data["negocio_direccion"],
        datos_fiscales=data["negocio_rfc"],
        telefono=data.get("negocio_telefono"),
        setup_completado=True,
    )
    db.add(config)
    await db.commit()

    # Reload with relationship
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.id == usuario.id)
    )
    return result.scalar_one()


# ─── Autenticación ──────────────────────────────────────────
async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[Usuario]:
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

    return user


async def create_session_token(db: AsyncSession, user: Usuario, remember: bool = False) -> str:
    """Create a session token for the user. Returns the raw token string."""
    token_str = generate_token()
    token_hashed = hash_token(token_str)

    if remember:
        expires_in_days = 30
    else:
        expires_in_days = 7

    token_record = TokenSesion(
        usuario_id=user.id,
        token_hash=token_hashed,
        es_persistente=remember,
        fecha_expiracion=get_token_expiry(days=expires_in_days),
        activo=True,
    )
    db.add(token_record)

    # Update last access
    user.ultimo_acceso = datetime.now(timezone.utc)
    await db.commit()

    return token_str


async def invalidate_token(db: AsyncSession, token_str: str) -> None:
    """Invalidate a session token."""
    token_hashed = hash_token(token_str)
    result = await db.execute(
        select(TokenSesion).where(TokenSesion.token_hash == token_hashed)
    )
    token_record = result.scalar_one_or_none()
    if token_record:
        token_record.activo = False
        await db.commit()


async def invalidate_all_user_tokens(db: AsyncSession, user_id: int) -> None:
    """Invalidate all active tokens for a user."""
    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.usuario_id == user_id,
            TokenSesion.activo == True,
        )
    )
    tokens = result.scalars().all()
    for token in tokens:
        token.activo = False
    await db.commit()


# ─── Recuperación de Contraseña ─────────────────────────────
async def create_reset_token(db: AsyncSession, email: str) -> Optional[str]:
    """Create a password reset token. Returns the raw token or None if email not found."""
    result = await db.execute(select(Usuario).where(Usuario.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        return None

    token_str = generate_token()
    token_hashed = hash_token(token_str)

    reset_token = TokenRestablecimiento(
        usuario_id=user.id,
        token_hash=token_hashed,
        fecha_expiracion=get_reset_token_expiry(),
        utilizado=False,
    )
    db.add(reset_token)
    await db.commit()

    return token_str


async def verify_reset_token(db: AsyncSession, token_str: str) -> Optional[str]:
    """Verify a reset token. Returns the user's email if valid, None otherwise."""
    token_hashed = hash_token(token_str)
    result = await db.execute(
        select(TokenRestablecimiento)
        .options(selectinload(TokenRestablecimiento.usuario))
        .where(
            TokenRestablecimiento.token_hash == token_hashed,
            TokenRestablecimiento.utilizado == False,
        )
    )
    token_record = result.scalar_one_or_none()

    if token_record is None:
        return None

    now = datetime.now(timezone.utc)
    if token_record.fecha_expiracion.replace(tzinfo=timezone.utc) < now:
        return None  # expired

    return token_record.usuario.email


async def reset_password(db: AsyncSession, token_str: str, new_password: str) -> bool:
    """Reset password using a reset token. Returns True if successful."""
    token_hashed = hash_token(token_str)
    result = await db.execute(
        select(TokenRestablecimiento)
        .options(selectinload(TokenRestablecimiento.usuario))
        .where(
            TokenRestablecimiento.token_hash == token_hashed,
            TokenRestablecimiento.utilizado == False,
        )
    )
    token_record = result.scalar_one_or_none()

    if token_record is None:
        return False

    now = datetime.now(timezone.utc)
    if token_record.fecha_expiracion.replace(tzinfo=timezone.utc) < now:
        return False

    # Update password
    user = token_record.usuario
    user.password_hash = hash_password(new_password)

    # Invalidate token
    token_record.utilizado = True

    # Invalidate all session tokens for security
    await invalidate_all_user_tokens(db, user.id)

    await db.commit()
    return True


# ─── Gestión de Usuarios ────────────────────────────────────
async def get_user_out(db: AsyncSession, user: Usuario) -> Usuario:
    """Ensure user has relationships loaded for serialization."""
    if not hasattr(user, "rol") or user.rol is None:
        result = await db.execute(
            select(Usuario)
            .options(selectinload(Usuario.rol))
            .where(Usuario.id == user.id)
        )
        user = result.scalar_one()
    return user


async def list_usuarios(
    db: AsyncSession,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
) -> Tuple[List[Usuario], int]:
    """List users with optional search and pagination."""
    query = select(Usuario).options(selectinload(Usuario.rol))

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Usuario.nombre_completo.ilike(search_pattern),
                Usuario.email.ilike(search_pattern),
            )
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Paginate
    query = query.order_by(Usuario.id.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    users = result.scalars().all()

    return list(users), total


async def get_usuario_by_id(db: AsyncSession, user_id: int) -> Optional[Usuario]:
    """Get a single user by ID with relationships loaded."""
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.id == user_id)
    )
    return result.scalar_one_or_none()


async def get_usuario_by_email(db: AsyncSession, email: str) -> Optional[Usuario]:
    """Get a user by email."""
    result = await db.execute(select(Usuario).where(Usuario.email == email))
    return result.scalar_one_or_none()


async def create_usuario(db: AsyncSession, data: dict) -> Usuario:
    """Create a new user."""
    # Get role
    result = await db.execute(select(Rol).where(Rol.nombre == data["rol"]))
    rol = result.scalar_one()

    usuario = Usuario(
        nombre_completo=data["nombre_completo"],
        email=data["email"],
        password_hash=hash_password(data["password"]),
        activo=True,
        rol_id=rol.id,
    )
    db.add(usuario)
    await db.commit()

    # Create default preferences
    preferencias = PreferenciasUsuario(usuario_id=usuario.id)
    db.add(preferencias)
    await db.commit()

    # Reload with rol
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.id == usuario.id)
    )
    return result.scalar_one()


async def update_usuario(db: AsyncSession, user_id: int, data: dict) -> Optional[Usuario]:
    """Update a user's data."""
    user = await get_usuario_by_id(db, user_id)
    if user is None:
        return None

    if "nombre_completo" in data and data["nombre_completo"] is not None:
        user.nombre_completo = data["nombre_completo"]

    if "email" in data and data["email"] is not None:
        user.email = data["email"]

    if "rol" in data and data["rol"] is not None:
        result = await db.execute(select(Rol).where(Rol.nombre == data["rol"]))
        rol = result.scalar_one()
        user.rol_id = rol.id

    await db.commit()

    # Reload
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.id == user.id)
    )
    return result.scalar_one()


async def deactivate_usuario(db: AsyncSession, user_id: int) -> Optional[Usuario]:
    """Deactivate a user and invalidate all their tokens."""
    user = await get_usuario_by_id(db, user_id)
    if user is None:
        return None

    user.activo = False
    await invalidate_all_user_tokens(db, user.id)
    await db.commit()

    return user


async def reactivate_usuario(db: AsyncSession, user_id: int) -> Optional[Usuario]:
    """Reactivate a deactivated user."""
    user = await get_usuario_by_id(db, user_id)
    if user is None:
        return None

    user.activo = True
    await db.commit()

    return user


# ─── Perfil ──────────────────────────────────────────────────
async def update_perfil(db: AsyncSession, user: Usuario, data: dict) -> Usuario:
    """Update the current user's profile."""
    if "nombre_completo" in data and data["nombre_completo"] is not None:
        user.nombre_completo = data["nombre_completo"]

    if "email" in data and data["email"] is not None:
        user.email = data["email"]

    await db.commit()

    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.id == user.id)
    )
    return result.scalar_one()


async def change_password(
    db: AsyncSession, user: Usuario, current_password: str, new_password: str
) -> bool:
    """Change the current user's password. Returns True if successful."""
    if not verify_password(current_password, user.password_hash):
        return False

    user.password_hash = hash_password(new_password)
    await invalidate_all_user_tokens(db, user.id)
    await db.commit()
    return True


# ─── Preferencias ───────────────────────────────────────────
async def get_preferencias(db: AsyncSession, user: Usuario) -> PreferenciasUsuario:
    """Get user preferences. Creates default if not exists."""
    if user.preferencias is not None:
        return user.preferencias

    # Check if preferences exist in DB
    result = await db.execute(
        select(PreferenciasUsuario).where(PreferenciasUsuario.usuario_id == user.id)
    )
    pref = result.scalar_one_or_none()

    if pref is None:
        pref = PreferenciasUsuario(usuario_id=user.id)
        db.add(pref)
        await db.commit()
        await db.refresh(pref)

    return pref


async def update_preferencias(db: AsyncSession, user: Usuario, data: dict) -> PreferenciasUsuario:
    """Update user preferences."""
    pref = await get_preferencias(db, user)

    if "idioma" in data and data["idioma"] is not None:
        pref.idioma = data["idioma"]
    if "tema_visual" in data and data["tema_visual"] is not None:
        pref.tema_visual = data["tema_visual"]
    if "configuracion_regional" in data and data["configuracion_regional"] is not None:
        pref.configuracion_regional = data["configuracion_regional"]

    await db.commit()
    await db.refresh(pref)
    return pref
