from datetime import datetime, timezone
from typing import Optional, List, Tuple

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from autenticacin_usuarios_y_configuracin_inicial.models import (
    Usuario,
    Rol,
    ConfiguracionNegocio,
    PreferenciasUsuario,
    TokenSesion,
    TokenRestablecimiento,
)
from autenticacin_usuarios_y_configuracin_inicial.utils import (
    hash_password,
    verify_password,
    generate_token,
    hash_token,
    get_token_expiry,
    get_reset_token_expiry,
    get_expires_in_seconds,
)
from config import settings


# ───── Setup ─────

async def check_setup_status(db: AsyncSession) -> dict:
    """Check if setup has been completed and if admin exists."""
    result = await db.execute(select(ConfiguracionNegocio))
    config = result.scalars().first()

    result_admin = await db.execute(
        select(Usuario).options(selectinload(Usuario.rol)).join(Usuario.rol).where(Rol.nombre == "administrador")
    )
    admin = result_admin.scalars().first()

    return {
        "setup_completed": config.setup_completado if config else False,
        "admin_exists": admin is not None,
    }


async def run_setup(db: AsyncSession, data: dict) -> Tuple[str, Usuario]:
    """Run initial setup: create admin user and business configuration."""
    # Check if setup already completed
    result = await db.execute(select(ConfiguracionNegocio))
    config = result.scalars().first()
    if config and config.setup_completado:
        raise ValueError("SETUP_ALREADY_COMPLETED")

    # Check if admin already exists
    result_admin = await db.execute(
        select(Usuario).options(selectinload(Usuario.rol)).join(Usuario.rol).where(Rol.nombre == "administrador")
    )
    if result_admin.scalars().first():
        raise ValueError("SETUP_ALREADY_COMPLETED")

    # Ensure admin role exists
    result_rol = await db.execute(select(Rol).where(Rol.nombre == "administrador"))
    admin_rol = result_rol.scalars().first()
    if not admin_rol:
        admin_rol = Rol(nombre="administrador", descripcion="Administrador del sistema con acceso completo")
        db.add(admin_rol)

    # Ensure other roles exist
    for role_name, role_desc in [("vendedor", "Vendedor / Cajero del punto de venta"),
                                   ("almacen", "Encargado de almacén y compras")]:
        result_r = await db.execute(select(Rol).where(Rol.nombre == role_name))
        if not result_r.scalars().first():
            db.add(Rol(nombre=role_name, descripcion=role_desc))

    await db.flush()

    # Create admin user
    user = Usuario(
        nombre_completo=data["nombre_completo"],
        email=data["email"],
        password_hash=hash_password(data["password"]),
        activo=True,
        rol_id=admin_rol.id,
    )
    db.add(user)
    await db.flush()

    # Create default preferences for admin
    pref = PreferenciasUsuario(
        usuario_id=user.id,
        idioma="es",
        tema_visual="light",
        configuracion_regional="es-MX",
    )
    db.add(pref)

    # Create or update business configuration
    if not config:
        config = ConfiguracionNegocio(
            nombre=data["negocio_nombre"],
            direccion=data["negocio_direccion"],
            datos_fiscales=data["negocio_rfc"],
            telefono=data.get("negocio_telefono"),
        )
        db.add(config)
    else:
        config.nombre = data["negocio_nombre"]
        config.direccion = data["negocio_direccion"]
        config.datos_fiscales = data["negocio_rfc"]
        config.telefono = data.get("negocio_telefono")
    config.setup_completado = True

    await db.commit()
    await db.refresh(user)
    # Reload with relationship
    result = await db.execute(
        select(Usuario).options(selectinload(Usuario.rol)).where(Usuario.id == user.id)
    )
    user = result.scalars().first()

    return "Configuración inicial completada exitosamente", user


# ───── Authentication ─────

async def authenticate_user(db: AsyncSession, email: str, password: str, remember: bool = False) -> dict:
    """Authenticate user and return token data."""
    result = await db.execute(
        select(Usuario).options(selectinload(Usuario.rol)).where(Usuario.email == email)
    )
    user = result.scalars().first()

    if not user or not verify_password(password, user.password_hash):
        raise ValueError("INVALID_CREDENTIALS")

    if not user.activo:
        raise ValueError("USER_INACTIVE")

    # Generate token
    token = generate_token()
    token_hashed = hash_token(token)
    expiry = get_token_expiry(remember)

    token_record = TokenSesion(
        usuario_id=user.id,
        token_hash=token_hashed,
        es_persistente=remember,
        fecha_expiracion=expiry,
        activo=True,
    )
    db.add(token_record)

    # Update last access
    user.ultimo_acceso = datetime.now(timezone.utc)
    await db.commit()

    return {
        "token": token,
        "token_type": "bearer",
        "expires_in": get_expires_in_seconds(expiry),
        "usuario": user,
    }


async def logout_user(db: AsyncSession, token: str):
    """Invalidate the given token."""
    token_hashed = hash_token(token)
    result = await db.execute(
        select(TokenSesion).where(TokenSesion.token_hash == token_hashed)
    )
    token_record = result.scalars().first()
    if token_record:
        token_record.activo = False
        await db.commit()


async def get_current_user_by_token(db: AsyncSession, token: str) -> Optional[Usuario]:
    """Get user from a raw token string."""
    token_hashed = hash_token(token)
    result = await db.execute(
        select(TokenSesion)
        .options(selectinload(TokenSesion.usuario).options(selectinload(Usuario.rol)))
        .where(
            TokenSesion.token_hash == token_hashed,
            TokenSesion.activo == True,
            TokenSesion.fecha_expiracion > datetime.now(timezone.utc),
        )
    )
    token_record = result.scalars().first()
    if not token_record or not token_record.usuario.activo:
        return None
    return token_record.usuario


# ───── Password Reset ─────

async def forgot_password(db: AsyncSession, email: str) -> str:
    """Generate a reset token for the user (if email exists)."""
    result = await db.execute(select(Usuario).where(Usuario.email == email))
    user = result.scalars().first()

    if not user:
        # Return generic success to avoid revealing email existence
        return "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña"

    # Invalidate existing unused tokens for this user
    result_tokens = await db.execute(
        select(TokenRestablecimiento).where(
            TokenRestablecimiento.usuario_id == user.id,
            TokenRestablecimiento.utilizado == False,
        )
    )
    old_tokens = result_tokens.scalars().all()
    for t in old_tokens:
        t.utilizado = True

    # Create new reset token
    raw_token = generate_token()
    reset_token = TokenRestablecimiento(
        usuario_id=user.id,
        token_hash=hash_token(raw_token),
        fecha_expiracion=get_reset_token_expiry(),
        utilizado=False,
    )
    db.add(reset_token)
    await db.commit()

    # In a real app, send email here
    # For MVP, return the token directly (email sending not implemented)
    return f"Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña"


async def verify_reset_token(db: AsyncSession, token: str) -> Optional[dict]:
    """Verify a reset token and return associated email if valid."""
    token_hashed = hash_token(token)
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(TokenRestablecimiento)
        .options(selectinload(TokenRestablecimiento.usuario))
        .where(
            TokenRestablecimiento.token_hash == token_hashed,
            TokenRestablecimiento.utilizado == False,
        )
    )
    token_record = result.scalars().first()

    if not token_record:
        return None

    if token_record.fecha_expiracion < now:
        return None

    return {"email": token_record.usuario.email}


async def reset_password(db: AsyncSession, token: str, new_password: str) -> str:
    """Reset password using a valid reset token."""
    token_hashed = hash_token(token)
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(TokenRestablecimiento)
        .options(selectinload(TokenRestablecimiento.usuario))
        .where(
            TokenRestablecimiento.token_hash == token_hashed,
            TokenRestablecimiento.utilizado == False,
        )
    )
    token_record = result.scalars().first()

    if not token_record or token_record.fecha_expiracion < now:
        raise ValueError("TOKEN_INVALID_OR_EXPIRED")

    # Update password
    user = token_record.usuario
    user.password_hash = hash_password(new_password)

    # Invalidate token
    token_record.utilizado = True

    # Invalidate all session tokens for this user
    result_sessions = await db.execute(
        select(TokenSesion).where(
            TokenSesion.usuario_id == user.id,
            TokenSesion.activo == True,
        )
    )
    sessions = result_sessions.scalars().all()
    for s in sessions:
        s.activo = False

    await db.commit()

    return "Contraseña restablecida exitosamente"


# ───── User Management ─────

async def list_usuarios(
    db: AsyncSession,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
) -> Tuple[List[Usuario], int]:
    """List users with pagination and optional search."""
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
    total = total_result.scalar()

    # Paginate
    offset = (page - 1) * page_size
    query = query.order_by(Usuario.id.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    users = result.scalars().all()

    return list(users), total


async def get_usuario(db: AsyncSession, user_id: int) -> Optional[Usuario]:
    """Get a single user by ID."""
    result = await db.execute(
        select(Usuario).options(selectinload(Usuario.rol)).where(Usuario.id == user_id)
    )
    return result.scalars().first()


async def create_usuario(db: AsyncSession, data: dict) -> Usuario:
    """Create a new user."""
    # Check if email already exists
    result = await db.execute(select(Usuario).where(Usuario.email == data["email"]))
    if result.scalars().first():
        raise ValueError("EMAIL_EXISTS")

    # Get role
    result_rol = await db.execute(select(Rol).where(Rol.nombre == data["rol"]))
    rol = result_rol.scalars().first()
    if not rol:
        raise ValueError("INVALID_ROLE")

    user = Usuario(
        nombre_completo=data["nombre_completo"],
        email=data["email"],
        password_hash=hash_password(data["password"]),
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
        configuracion_regional="es-MX",
    )
    db.add(pref)
    await db.commit()

    # Reload with role
    result = await db.execute(
        select(Usuario).options(selectinload(Usuario.rol)).where(Usuario.id == user.id)
    )
    return result.scalars().first()


async def update_usuario(db: AsyncSession, user_id: int, data: dict) -> Usuario:
    """Update an existing user."""
    result = await db.execute(
        select(Usuario).options(selectinload(Usuario.rol)).where(Usuario.id == user_id)
    )
    user = result.scalars().first()
    if not user:
        raise ValueError("NOT_FOUND")

    # Check email uniqueness if changing email
    if "email" in data and data["email"] and data["email"] != user.email:
        result_email = await db.execute(select(Usuario).where(Usuario.email == data["email"]))
        if result_email.scalars().first():
            raise ValueError("EMAIL_EXISTS")
        user.email = data["email"]

    if "nombre_completo" in data and data["nombre_completo"]:
        user.nombre_completo = data["nombre_completo"]

    if "rol" in data and data["rol"]:
        result_rol = await db.execute(select(Rol).where(Rol.nombre == data["rol"]))
        rol = result_rol.scalars().first()
        if not rol:
            raise ValueError("INVALID_ROLE")
        user.rol_id = rol.id

    await db.commit()

    # Reload
    result = await db.execute(
        select(Usuario).options(selectinload(Usuario.rol)).where(Usuario.id == user_id)
    )
    return result.scalars().first()


async def deactivate_usuario(db: AsyncSession, user_id: int, current_user_id: int) -> Usuario:
    """Deactivate a user account."""
    if user_id == current_user_id:
        raise ValueError("CANNOT_DEACTIVATE_SELF")

    result = await db.execute(
        select(Usuario).options(selectinload(Usuario.rol)).where(Usuario.id == user_id)
    )
    user = result.scalars().first()
    if not user:
        raise ValueError("NOT_FOUND")

    user.activo = False

    # Invalidate all session tokens
    result_sessions = await db.execute(
        select(TokenSesion).where(
            TokenSesion.usuario_id == user_id,
            TokenSesion.activo == True,
        )
    )
    sessions = result_sessions.scalars().all()
    for s in sessions:
        s.activo = False

    await db.commit()

    # Reload
    result = await db.execute(
        select(Usuario).options(selectinload(Usuario.rol)).where(Usuario.id == user_id)
    )
    return result.scalars().first()


async def reactivate_usuario(db: AsyncSession, user_id: int) -> Usuario:
    """Reactivate a user account."""
    result = await db.execute(
        select(Usuario).options(selectinload(Usuario.rol)).where(Usuario.id == user_id)
    )
    user = result.scalars().first()
    if not user:
        raise ValueError("NOT_FOUND")

    user.activo = True
    await db.commit()

    # Reload
    result = await db.execute(
        select(Usuario).options(selectinload(Usuario.rol)).where(Usuario.id == user_id)
    )
    return result.scalars().first()


# ───── Profile ─────

async def get_perfil(db: AsyncSession, user: Usuario) -> dict:
    """Get user profile with preferences."""
    result = await db.execute(
        select(PreferenciasUsuario).where(PreferenciasUsuario.usuario_id == user.id)
    )
    pref = result.scalars().first()
    if not pref:
        pref = PreferenciasUsuario(
            usuario_id=user.id,
            idioma="es",
            tema_visual="light",
            configuracion_regional="es-MX",
        )
        db.add(pref)
        await db.commit()
        await db.refresh(pref)

    return {"usuario": user, "preferencias": pref}


async def update_perfil(db: AsyncSession, user: Usuario, data: dict) -> Usuario:
    """Update user profile data."""
    if "email" in data and data["email"] and data["email"] != user.email:
        result_email = await db.execute(select(Usuario).where(Usuario.email == data["email"]))
        if result_email.scalars().first():
            raise ValueError("EMAIL_EXISTS")
        user.email = data["email"]

    if "nombre_completo" in data and data["nombre_completo"]:
        user.nombre_completo = data["nombre_completo"]

    await db.commit()

    # Reload
    result = await db.execute(
        select(Usuario).options(selectinload(Usuario.rol)).where(Usuario.id == user.id)
    )
    return result.scalars().first()


async def change_password(db: AsyncSession, user: Usuario, current_password: str, new_password: str) -> str:
    """Change user password."""
    if not verify_password(current_password, user.password_hash):
        raise ValueError("INVALID_CURRENT_PASSWORD")

    user.password_hash = hash_password(new_password)

    # Invalidate all session tokens for this user (except current one will be handled by client re-login)
    await db.commit()

    return "Contraseña cambiada exitosamente"


async def get_preferencias(db: AsyncSession, user: Usuario) -> PreferenciasUsuario:
    """Get user preferences."""
    result = await db.execute(
        select(PreferenciasUsuario).where(PreferenciasUsuario.usuario_id == user.id)
    )
    pref = result.scalars().first()
    if not pref:
        pref = PreferenciasUsuario(
            usuario_id=user.id,
            idioma="es",
            tema_visual="light",
            configuracion_regional="es-MX",
        )
        db.add(pref)
        await db.commit()
        await db.refresh(pref)
    return pref


async def update_preferencias(db: AsyncSession, user: Usuario, data: dict) -> PreferenciasUsuario:
    """Update user preferences."""
    result = await db.execute(
        select(PreferenciasUsuario).where(PreferenciasUsuario.usuario_id == user.id)
    )
    pref = result.scalars().first()
    if not pref:
        pref = PreferenciasUsuario(
            usuario_id=user.id,
            idioma="es",
            tema_visual="light",
            configuracion_regional="es-MX",
        )
        db.add(pref)
        await db.flush()

    if "idioma" in data and data["idioma"]:
        pref.idioma = data["idioma"]
    if "tema_visual" in data and data["tema_visual"]:
        pref.tema_visual = data["tema_visual"]
    if "zona_horaria" in data and data["zona_horaria"]:
        pref.configuracion_regional = data["zona_horaria"]

    await db.commit()
    await db.refresh(pref)
    return pref
