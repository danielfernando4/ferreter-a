from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, func, or_, delete
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
    compute_reset_token_expiry,
    compute_token_expiry,
    generate_token,
    hash_password,
    hash_token,
    verify_password,
)
from config import settings


# ──────────────────────────── Setup / Wizard ────────────────────────────

async def check_setup_status(db: AsyncSession) -> tuple[bool, bool]:
    """Check if setup has been completed and if an admin exists."""
    result = await db.execute(
        select(ConfiguracionNegocio).where(ConfiguracionNegocio.setup_completado == True)
    )
    config = result.scalar_one_or_none()
    setup_completed = config is not None

    result = await db.execute(
        select(Usuario)
        .join(Rol, Usuario.rol_id == Rol.id)
        .where(Rol.nombre == "administrador")
        .limit(1)
    )
    admin = result.scalar_one_or_none()
    admin_exists = admin is not None

    return setup_completed, admin_exists


async def run_setup(db: AsyncSession, data: dict) -> Usuario:
    """Run the initial setup wizard: create admin user + business config."""
    # Create the business configuration
    config = ConfiguracionNegocio(
        nombre=data["negocio_nombre"],
        direccion=data["negocio_direccion"],
        datos_fiscales=data["negocio_rfc"],
        telefono=data.get("negocio_telefono"),
        setup_completado=True,
    )
    db.add(config)

    # Get admin role
    result = await db.execute(select(Rol).where(Rol.nombre == "administrador"))
    admin_role = result.scalar_one_or_none()
    if not admin_role:
        admin_role = Rol(nombre="administrador", descripcion="Administrador del sistema con acceso completo")
        db.add(admin_role)
        await db.flush()

    # Create admin user
    usuario = Usuario(
        nombre_completo=data["nombre_completo"],
        email=data["email"],
        password_hash=hash_password(data["password"]),
        activo=True,
        rol_id=admin_role.id,
        fecha_registro=datetime.now(timezone.utc),
        fecha_actualizacion=datetime.now(timezone.utc),
    )
    db.add(usuario)
    await db.flush()

    # Create default preferences for the admin user
    preferencias = PreferenciasUsuario(
        usuario_id=usuario.id,
        idioma="es",
        tema_visual="light",
        zona_horaria="America/Mexico_City",
    )
    db.add(preferencias)
    await db.commit()
    await db.refresh(usuario)

    return usuario


# ──────────────────────────── Autenticación ────────────────────────────

async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[Usuario]:
    """Authenticate a user by email and password. Returns the user or None."""
    result = await db.execute(
        select(Usuario).where(Usuario.email == email, Usuario.activo == True)
    )
    usuario = result.scalar_one_or_none()
    if not usuario:
        return None
    if not verify_password(password, usuario.password_hash):
        return None
    return usuario


async def create_session_token(db: AsyncSession, usuario: Usuario, remember: bool = False) -> tuple[str, int]:
    """Create a new session token for the user. Returns (token_string, expires_in_seconds)."""
    token_str = generate_token()
    token_hash_val = hash_token(token_str)
    expires_at = compute_token_expiry(remember)
    expires_in = int((expires_at - datetime.now(timezone.utc)).total_seconds())

    token = TokenSesion(
        usuario_id=usuario.id,
        token_hash=token_hash_val,
        es_persistente=remember,
        fecha_expiracion=expires_at,
        activo=True,
    )
    db.add(token)

    # Update ultimo_acceso
    usuario.ultimo_acceso = datetime.now(timezone.utc)
    usuario.fecha_actualizacion = datetime.now(timezone.utc)

    await db.commit()

    return token_str, expires_in


async def get_user_from_token(db: AsyncSession, token_str: str) -> Optional[Usuario]:
    """Get the user associated with a valid session token."""
    token_hash_val = hash_token(token_str)
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.token_hash == token_hash_val,
            TokenSesion.activo == True,
            TokenSesion.fecha_expiracion > now,
        )
    )
    token = result.scalar_one_or_none()
    if not token:
        return None

    # Get user
    result = await db.execute(
        select(Usuario).where(Usuario.id == token.usuario_id, Usuario.activo == True)
    )
    usuario = result.scalar_one_or_none()
    return usuario


async def invalidate_token(db: AsyncSession, token_str: str) -> None:
    """Invalidate a session token (logout)."""
    token_hash_val = hash_token(token_str)
    result = await db.execute(select(TokenSesion).where(TokenSesion.token_hash == token_hash_val))
    token = result.scalar_one_or_none()
    if token:
        token.activo = False
        await db.commit()


async def invalidate_all_user_tokens(db: AsyncSession, usuario_id: int) -> None:
    """Invalidate all active tokens for a user."""
    await db.execute(
        delete(TokenSesion).where(
            TokenSesion.usuario_id == usuario_id,
            TokenSesion.activo == True,
        )
    )
    await db.commit()


# ──────────────────────────── Recuperación de Contraseña ────────────────────────────

async def create_reset_token(db: AsyncSession, email: str) -> Optional[str]:
    """Create a password reset token for the user with the given email.
    Returns the token string, or None if email not found."""
    result = await db.execute(select(Usuario).where(Usuario.email == email, Usuario.activo == True))
    usuario = result.scalar_one_or_none()
    if not usuario:
        return None

    token_str = generate_token()
    token_hash_val = hash_token(token_str)
    expires_at = compute_reset_token_expiry()

    reset_token = TokenRestablecimiento(
        usuario_id=usuario.id,
        token_hash=token_hash_val,
        fecha_expiracion=expires_at,
        utilizado=False,
    )
    db.add(reset_token)
    await db.commit()

    return token_str


async def verify_reset_token(db: AsyncSession, token_str: str) -> Optional[str]:
    """Verify a reset token and return the associated email if valid."""
    token_hash_val = hash_token(token_str)
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(TokenRestablecimiento).where(
            TokenRestablecimiento.token_hash == token_hash_val,
            TokenRestablecimiento.utilizado == False,
            TokenRestablecimiento.fecha_expiracion > now,
        )
    )
    reset_token = result.scalar_one_or_none()
    if not reset_token:
        return None

    result = await db.execute(select(Usuario).where(Usuario.id == reset_token.usuario_id))
    usuario = result.scalar_one_or_none()
    if not usuario:
        return None

    return usuario.email


async def reset_password(db: AsyncSession, token_str: str, new_password: str) -> bool:
    """Reset the password using a valid reset token. Returns success."""
    token_hash_val = hash_token(token_str)
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(TokenRestablecimiento).where(
            TokenRestablecimiento.token_hash == token_hash_val,
            TokenRestablecimiento.utilizado == False,
            TokenRestablecimiento.fecha_expiracion > now,
        )
    )
    reset_token = result.scalar_one_or_none()
    if not reset_token:
        return False

    result = await db.execute(select(Usuario).where(Usuario.id == reset_token.usuario_id))
    usuario = result.scalar_one_or_none()
    if not usuario:
        return False

    # Update password
    usuario.password_hash = hash_password(new_password)
    usuario.fecha_actualizacion = datetime.now(timezone.utc)

    # Invalidate token
    reset_token.utilizado = True

    # Invalidate all session tokens for security
    await invalidate_all_user_tokens(db, usuario.id)

    await db.commit()
    return True


# ──────────────────────────── CRUD Usuarios ────────────────────────────

async def list_usuarios(
    db: AsyncSession,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[Usuario], int]:
    """List users with optional search and pagination. Returns (users, total_count)."""
    query = select(Usuario)
    count_query = select(func.count(Usuario.id))

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Usuario.nombre_completo.ilike(search_pattern),
                Usuario.email.ilike(search_pattern),
            )
        )
        count_query = count_query.where(
            or_(
                Usuario.nombre_completo.ilike(search_pattern),
                Usuario.email.ilike(search_pattern),
            )
        )

    # Get total count
    result = await db.execute(count_query)
    total = result.scalar() or 0

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Usuario.fecha_registro.desc())

    result = await db.execute(query)
    usuarios = list(result.scalars().all())

    return usuarios, total


async def get_usuario_by_id(db: AsyncSession, usuario_id: int) -> Optional[Usuario]:
    """Get a user by ID."""
    result = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    return result.scalar_one_or_none()


async def get_usuario_by_email(db: AsyncSession, email: str) -> Optional[Usuario]:
    """Get a user by email."""
    result = await db.execute(select(Usuario).where(Usuario.email == email))
    return result.scalar_one_or_none()


async def create_usuario(db: AsyncSession, data: dict) -> Usuario:
    """Create a new user with the given data."""
    # Get role
    result = await db.execute(select(Rol).where(Rol.nombre == data["rol"]))
    role = result.scalar_one_or_none()
    if not role:
        raise ValueError(f"Rol '{data['rol']}' no encontrado")

    usuario = Usuario(
        nombre_completo=data["nombre_completo"],
        email=data["email"],
        password_hash=hash_password(data["password"]),
        activo=True,
        rol_id=role.id,
        fecha_registro=datetime.now(timezone.utc),
        fecha_actualizacion=datetime.now(timezone.utc),
    )
    db.add(usuario)
    await db.flush()

    # Create default preferences
    preferencias = PreferenciasUsuario(
        usuario_id=usuario.id,
        idioma="es",
        tema_visual="light",
        zona_horaria="America/Mexico_City",
    )
    db.add(preferencias)
    await db.commit()
    await db.refresh(usuario)

    return usuario


async def update_usuario(db: AsyncSession, usuario: Usuario, data: dict) -> Usuario:
    """Update user fields from data dict."""
    if "nombre_completo" in data and data["nombre_completo"] is not None:
        usuario.nombre_completo = data["nombre_completo"]
    if "email" in data and data["email"] is not None:
        usuario.email = data["email"]
    if "rol" in data and data["rol"] is not None:
        result = await db.execute(select(Rol).where(Rol.nombre == data["rol"]))
        role = result.scalar_one_or_none()
        if role:
            usuario.rol_id = role.id

    usuario.fecha_actualizacion = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(usuario)

    return usuario


async def deactivate_usuario(db: AsyncSession, usuario: Usuario) -> Usuario:
    """Deactivate a user and invalidate all their tokens."""
    usuario.activo = False
    usuario.fecha_actualizacion = datetime.now(timezone.utc)
    await invalidate_all_user_tokens(db, usuario.id)
    await db.commit()
    await db.refresh(usuario)
    return usuario


async def reactivate_usuario(db: AsyncSession, usuario: Usuario) -> Usuario:
    """Reactivate a user."""
    usuario.activo = True
    usuario.fecha_actualizacion = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(usuario)
    return usuario


async def ensure_roles_exist(db: AsyncSession) -> None:
    """Ensure the predefined roles exist in the database."""
    for rol_name in settings.ROLES:
        result = await db.execute(select(Rol).where(Rol.nombre == rol_name))
        existing = result.scalar_one_or_none()
        if not existing:
            descripciones = {
                "administrador": "Administrador del sistema con acceso completo a todas las funcionalidades",
                "vendedor": "Vendedor / Cajero con acceso al punto de venta y módulos operativos",
                "almacen": "Encargado de compras / Almacén con acceso a inventario y órdenes de compra",
            }
            rol = Rol(nombre=rol_name, descripcion=descripciones.get(rol_name, ""))
            db.add(rol)
    await db.commit()


# ──────────────────────────── Perfil y Preferencias ────────────────────────────

async def get_preferencias(db: AsyncSession, usuario_id: int) -> Optional[PreferenciasUsuario]:
    """Get user preferences."""
    result = await db.execute(
        select(PreferenciasUsuario).where(PreferenciasUsuario.usuario_id == usuario_id)
    )
    return result.scalar_one_or_none()


async def update_preferencias(db: AsyncSession, usuario_id: int, data: dict) -> PreferenciasUsuario:
    """Update user preferences."""
    result = await db.execute(
        select(PreferenciasUsuario).where(PreferenciasUsuario.usuario_id == usuario_id)
    )
    preferencias = result.scalar_one_or_none()

    if not preferencias:
        preferencias = PreferenciasUsuario(usuario_id=usuario_id)
        db.add(preferencias)

    if "idioma" in data and data["idioma"] is not None:
        preferencias.idioma = data["idioma"]
    if "tema_visual" in data and data["tema_visual"] is not None:
        preferencias.tema_visual = data["tema_visual"]
    if "zona_horaria" in data and data["zona_horaria"] is not None:
        preferencias.zona_horaria = data["zona_horaria"]

    await db.commit()
    await db.refresh(preferencias)
    return preferencias


async def change_user_password(
    db: AsyncSession, usuario: Usuario, current_password: str, new_password: str
) -> bool:
    """Change user password. Validates current password first. Returns success."""
    if not verify_password(current_password, usuario.password_hash):
        return False

    usuario.password_hash = hash_password(new_password)
    usuario.fecha_actualizacion = datetime.now(timezone.utc)
    await db.commit()
    return True
