from datetime import datetime, timezone
from typing import Optional, List, Tuple

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, attributes

from database import get_db
from autenticacin_usuarios_y_configuracin_inicial.models import (
    Usuario, Rol, ConfiguracionNegocio, PreferenciasUsuario,
    TokenSesion, TokenRestablecimiento
)
from autenticacin_usuarios_y_configuracin_inicial.schemas import UserOut
from autenticacin_usuarios_y_configuracin_inicial.utils import (
    hash_password, verify_password, create_access_token, decode_access_token,
    generate_session_token, generate_reset_token, hash_token,
    get_token_expires_delta, get_token_expires_seconds, get_reset_token_expiry
)


# --- Helper: Get User Out ---

async def _get_user_out(user: Usuario) -> UserOut:
    """Safely convert a Usuario ORM object to UserOut schema.
    Assumes user.rol is already loaded (via selectinload or refresh).
    """
    return UserOut(
        id=user.id,
        nombre_completo=user.nombre_completo,
        email=user.email,
        rol=user.rol.nombre if user.rol else "desconocido",
        activo=user.activo,
        fecha_registro=user.fecha_creacion,
        ultimo_acceso=user.ultimo_acceso,
    )


async def _get_user_by_id(db: AsyncSession, user_id: int) -> Optional[Usuario]:
    """Get user by ID with all relationships eagerly loaded."""
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


async def _get_user_by_email(db: AsyncSession, email: str) -> Optional[Usuario]:
    """Get user by email with all relationships eagerly loaded."""
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


# --- Setup ---

async def check_setup_status(db: AsyncSession) -> dict:
    """Check if setup is completed and if any admin exists."""
    config_result = await db.execute(
        select(ConfiguracionNegocio).where(ConfiguracionNegocio.setup_completado == True)
    )
    config = config_result.scalar_one_or_none()

    admin_result = await db.execute(
        select(Usuario)
        .join(Rol)
        .where(Rol.nombre == "administrador")
        .limit(1)
    )
    admin = admin_result.scalar_one_or_none()

    return {
        "setup_completed": config is not None,
        "admin_exists": admin is not None,
    }


async def run_setup(db: AsyncSession, data) -> Tuple[str, Usuario]:
    """Execute the initial setup wizard. Creates admin role, admin user, and business config."""
    # Verify setup not already completed
    config_result = await db.execute(
        select(ConfiguracionNegocio).where(ConfiguracionNegocio.setup_completado == True)
    )
    existing_config = config_result.scalar_one_or_none()
    if existing_config:
        raise ValueError("SETUP_ALREADY_COMPLETED")

    # Check if admin already exists
    admin_result = await db.execute(
        select(Usuario)
        .join(Rol)
        .where(Rol.nombre == "administrador")
        .limit(1)
    )
    if admin_result.scalar_one_or_none():
        raise ValueError("SETUP_ALREADY_COMPLETED")

    # Check if email already in use
    existing_user = await _get_user_by_email(db, data.email)
    if existing_user:
        raise ValueError("EMAIL_EXISTS")

    # Create or get roles
    roles_data = [
        ("administrador", "Acceso completo al sistema. Gestión de usuarios, configuración y todos los módulos."),
        ("vendedor", "Acceso al Punto de Venta (POS), consulta de productos y clientes."),
        ("almacen", "Acceso a inventario, órdenes de compra y catálogo de productos."),
    ]
    roles = {}
    for nombre, descripcion in roles_data:
        result = await db.execute(select(Rol).where(Rol.nombre == nombre))
        rol = result.scalar_one_or_none()
        if not rol:
            rol = Rol(nombre=nombre, descripcion=descripcion)
            db.add(rol)
            await db.flush()
        roles[nombre] = rol

    admin_rol = roles["administrador"]

    # Create admin user
    now = datetime.now(timezone.utc)
    admin_user = Usuario(
        nombre_completo=data.nombre_completo,
        email=data.email,
        password_hash=hash_password(data.password),
        activo=True,
        rol_id=admin_rol.id,
        fecha_creacion=now,
        fecha_actualizacion=now,
    )
    db.add(admin_user)
    await db.flush()

    # Create default preferences for admin
    prefs = PreferenciasUsuario(
        usuario_id=admin_user.id,
        idioma="es",
        tema_visual="light",
        zona_horaria="America/Mexico_City",
    )
    db.add(prefs)

    # Create business config
    negocio = ConfiguracionNegocio(
        nombre=data.negocio_nombre,
        direccion=data.negocio_direccion,
        datos_fiscales=data.negocio_rfc,
        telefono=data.negocio_telefono,
        email_contacto=data.email,
        setup_completado=True,
        fecha_creacion=now,
    )
    db.add(negocio)
    await db.flush()

    # Re-fetch admin with relationships loaded for serialization
    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.tokens_sesion),
            selectinload(Usuario.preferencias),
        )
        .where(Usuario.id == admin_user.id)
    )
    fresh_admin = result.scalar_one()

    await db.commit()
    return "Configuración inicial completada exitosamente", fresh_admin


# --- Authentication ---

async def authenticate_user(db: AsyncSession, email: str, password: str, remember: bool) -> dict:
    """Authenticate a user and return token + user data."""
    user = await _get_user_by_email(db, email)
    if not user or not user.activo:
        raise ValueError("INVALID_CREDENTIALS")

    if not verify_password(password, user.password_hash):
        raise ValueError("INVALID_CREDENTIALS")

    # Update ultimo_acceso
    user.ultimo_acceso = datetime.now(timezone.utc)

    # Create session token
    session_token = generate_session_token()
    token_hash_val = hash_token(session_token)
    expires_delta = get_token_expires_delta(remember)
    expires_in = get_token_expires_seconds(remember)
    expires_at = datetime.now(timezone.utc) + expires_delta

    token_record = TokenSesion(
        usuario_id=user.id,
        token_hash=token_hash_val,
        es_persistente=remember,
        fecha_expiracion=expires_at,
        fecha_creacion=datetime.now(timezone.utc),
        activo=True,
    )
    db.add(token_record)

    # Create JWT token
    jwt_token = create_access_token(
        data={"sub": str(user.id), "token_hash": token_hash_val, "remember": remember},
        expires_delta=expires_delta,
    )

    await db.commit()
    await db.refresh(user, ["rol"])

    return {
        "token": jwt_token,
        "token_type": "bearer",
        "expires_in": expires_in,
        "usuario": await _get_user_out(user),
    }


async def get_current_user_from_token(db: AsyncSession, token: str) -> Optional[Usuario]:
    """Validate JWT token and return the authenticated user."""
    payload = decode_access_token(token)
    if payload is None:
        return None

    user_id = payload.get("sub")
    token_hash_val = payload.get("token_hash")
    if not user_id or not token_hash_val:
        return None

    # Find the session token record
    result = await db.execute(
        select(TokenSesion)
        .where(
            TokenSesion.token_hash == token_hash_val,
            TokenSesion.activo == True,
            TokenSesion.fecha_expiracion > datetime.now(timezone.utc),
        )
    )
    token_record = result.scalar_one_or_none()
    if not token_record:
        return None

    # Get user with relationships
    user = await _get_user_by_id(db, int(user_id))
    if not user or not user.activo:
        return None

    return user


async def logout_user(db: AsyncSession, token: str) -> None:
    """Invalidate the session token."""
    payload = decode_access_token(token)
    if payload is None:
        raise ValueError("INVALID_TOKEN")

    token_hash_val = payload.get("token_hash")
    if not token_hash_val:
        raise ValueError("INVALID_TOKEN")

    result = await db.execute(
        select(TokenSesion).where(TokenSesion.token_hash == token_hash_val)
    )
    token_record = result.scalar_one_or_none()
    if token_record:
        token_record.activo = False
        await db.commit()


# --- Password Reset ---

async def forgot_password(db: AsyncSession, email: str) -> dict:
    """Generate a password reset token for the user. Always returns success to prevent email enumeration."""
    user = await _get_user_by_email(db, email)
    if not user:
        # Return generic success to not reveal email existence
        return {"mensaje": "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña."}

    # Invalidate any previous unused tokens
    old_tokens = await db.execute(
        select(TokenRestablecimiento).where(
            TokenRestablecimiento.usuario_id == user.id,
            TokenRestablecimiento.utilizado == False,
            TokenRestablecimiento.fecha_expiracion > datetime.now(timezone.utc),
        )
    )
    for old_token in old_tokens.scalars().all():
        old_token.utilizado = True

    # Create new reset token
    reset_token = generate_reset_token()
    token_hash_val = hash_token(reset_token)
    expiry = get_reset_token_expiry()

    reset_record = TokenRestablecimiento(
        usuario_id=user.id,
        token_hash=token_hash_val,
        fecha_expiracion=expiry,
        utilizado=False,
        fecha_creacion=datetime.now(timezone.utc),
    )
    db.add(reset_record)
    await db.commit()

    # In a production system, send email here with reset_token link
    # For MVP, the reset token is returned conceptually

    return {"mensaje": "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña."}


async def verify_reset_token(db: AsyncSession, token: str) -> dict:
    """Verify if a reset token is valid and return associated email."""
    token_hash_val = hash_token(token)
    result = await db.execute(
        select(TokenRestablecimiento).where(
            TokenRestablecimiento.token_hash == token_hash_val,
            TokenRestablecimiento.utilizado == False,
        )
    )
    reset_record = result.scalar_one_or_none()

    if not reset_record:
        return {"valido": False, "email": ""}

    if reset_record.fecha_expiracion < datetime.now(timezone.utc):
        return {"valido": False, "email": ""}

    # Get user email
    user_result = await db.execute(
        select(Usuario).where(Usuario.id == reset_record.usuario_id)
    )
    user = user_result.scalar_one_or_none()
    if not user:
        return {"valido": False, "email": ""}

    return {"valido": True, "email": user.email}


async def reset_password(db: AsyncSession, token: str, new_password: str, confirm_password: str) -> dict:
    """Reset user password using a valid reset token."""
    if new_password != confirm_password:
        raise ValueError("PASSWORDS_DONT_MATCH")

    token_hash_val = hash_token(token)
    result = await db.execute(
        select(TokenRestablecimiento).where(
            TokenRestablecimiento.token_hash == token_hash_val,
            TokenRestablecimiento.utilizado == False,
        )
    )
    reset_record = result.scalar_one_or_none()

    if not reset_record:
        raise ValueError("TOKEN_INVALID_OR_EXPIRED")

    if reset_record.fecha_expiracion < datetime.now(timezone.utc):
        reset_record.utilizado = True
        await db.commit()
        raise ValueError("TOKEN_INVALID_OR_EXPIRED")

    # Get user
    user_result = await db.execute(
        select(Usuario).where(Usuario.id == reset_record.usuario_id)
    )
    user = user_result.scalar_one_or_none()
    if not user:
        raise ValueError("TOKEN_INVALID_OR_EXPIRED")

    # Update password
    user.password_hash = hash_password(new_password)
    user.fecha_actualizacion = datetime.now(timezone.utc)

    # Mark token as used
    reset_record.utilizado = True

    # Invalidate all session tokens for this user
    session_tokens = await db.execute(
        select(TokenSesion).where(
            TokenSesion.usuario_id == user.id,
            TokenSesion.activo == True,
        )
    )
    for st in session_tokens.scalars().all():
        st.activo = False

    await db.commit()
    return {"mensaje": "Contraseña restablecida exitosamente."}


# --- User Management ---

async def list_usuarios(
    db: AsyncSession,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
) -> dict:
    """List users with pagination and optional search."""
    query = (
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.tokens_sesion),
            selectinload(Usuario.preferencias),
        )
    )

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
    total = total_result.scalar() or 0

    total_pages = max(1, (total + page_size - 1) // page_size)

    # Paginate
    offset = (page - 1) * page_size
    query = query.order_by(Usuario.fecha_creacion.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    users = result.scalars().all()

    items = []
    for user in users:
        items.append(await _get_user_out(user))

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


async def get_usuario(db: AsyncSession, user_id: int) -> Usuario:
    """Get a single user by ID."""
    user = await _get_user_by_id(db, user_id)
    if not user:
        raise ValueError("NOT_FOUND")
    return user


async def create_usuario(db: AsyncSession, data) -> Usuario:
    """Create a new user."""
    # Validate rol
    result = await db.execute(select(Rol).where(Rol.nombre == data.rol))
    rol = result.scalar_one_or_none()
    if not rol:
        raise ValueError("INVALID_ROLE")

    # Check email uniqueness
    existing = await _get_user_by_email(db, data.email)
    if existing:
        raise ValueError("EMAIL_EXISTS")

    now = datetime.now(timezone.utc)
    new_user = Usuario(
        nombre_completo=data.nombre_completo,
        email=data.email,
        password_hash=hash_password(data.password),
        activo=True,
        rol_id=rol.id,
        fecha_creacion=now,
        fecha_actualizacion=now,
    )
    db.add(new_user)
    await db.flush()

    # Create default preferences
    prefs = PreferenciasUsuario(
        usuario_id=new_user.id,
        idioma="es",
        tema_visual="light",
        zona_horaria="America/Mexico_City",
    )
    db.add(prefs)
    await db.flush()

    # Re-fetch with relationships loaded
    result2 = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.tokens_sesion),
            selectinload(Usuario.preferencias),
        )
        .where(Usuario.id == new_user.id)
    )
    fresh_user = result2.scalar_one()

    await db.commit()
    return fresh_user


async def update_usuario(db: AsyncSession, user_id: int, data) -> Usuario:
    """Update an existing user (name, email, role only, not password)."""
    user = await _get_user_by_id(db, user_id)
    if not user:
        raise ValueError("NOT_FOUND")

    if data.nombre_completo is not None:
        user.nombre_completo = data.nombre_completo

    if data.email is not None:
        # Check email uniqueness (excluding current user)
        email_check = await db.execute(
            select(Usuario).where(Usuario.email == data.email, Usuario.id != user_id)
        )
        if email_check.scalar_one_or_none():
            raise ValueError("EMAIL_EXISTS")
        user.email = data.email

    if data.rol is not None:
        rol_result = await db.execute(select(Rol).where(Rol.nombre == data.rol))
        rol = rol_result.scalar_one_or_none()
        if not rol:
            raise ValueError("INVALID_ROLE")
        user.rol_id = rol.id

    user.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()

    # Re-fetch with relationships
    result2 = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.tokens_sesion),
            selectinload(Usuario.preferencias),
        )
        .where(Usuario.id == user_id)
    )
    fresh_user = result2.scalar_one()

    await db.commit()
    return fresh_user


async def deactivate_usuario(db: AsyncSession, user_id: int, current_user_id: int) -> Usuario:
    """Deactivate a user. Cannot deactivate yourself."""
    if user_id == current_user_id:
        raise ValueError("CANNOT_DEACTIVATE_SELF")

    user = await _get_user_by_id(db, user_id)
    if not user:
        raise ValueError("NOT_FOUND")

    user.activo = False
    user.fecha_actualizacion = datetime.now(timezone.utc)

    # Invalidate all session tokens
    tokens_result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.usuario_id == user_id,
            TokenSesion.activo == True,
        )
    )
    for token in tokens_result.scalars().all():
        token.activo = False

    await db.flush()

    # Re-fetch with relationships
    result2 = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.tokens_sesion),
            selectinload(Usuario.preferencias),
        )
        .where(Usuario.id == user_id)
    )
    fresh_user = result2.scalar_one()

    await db.commit()
    return fresh_user


async def reactivate_usuario(db: AsyncSession, user_id: int) -> Usuario:
    """Reactivate a deactivated user."""
    user = await _get_user_by_id(db, user_id)
    if not user:
        raise ValueError("NOT_FOUND")

    user.activo = True
    user.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()

    # Re-fetch with relationships
    result2 = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.tokens_sesion),
            selectinload(Usuario.preferencias),
        )
        .where(Usuario.id == user_id)
    )
    fresh_user = result2.scalar_one()

    await db.commit()
    return fresh_user


# --- Profile ---

async def get_perfil(db: AsyncSession, user_id: int) -> dict:
    """Get user profile with preferences."""
    user = await _get_user_by_id(db, user_id)
    if not user:
        raise ValueError("NOT_FOUND")

    # Get preferences
    prefs_result = await db.execute(
        select(PreferenciasUsuario).where(PreferenciasUsuario.usuario_id == user_id)
    )
    prefs = prefs_result.scalar_one_or_none()
    if not prefs:
        prefs = PreferenciasUsuario(
            usuario_id=user_id,
            idioma="es",
            tema_visual="light",
            zona_horaria="America/Mexico_City",
        )
        db.add(prefs)
        await db.commit()

    return {
        "usuario": await _get_user_out(user),
        "preferencias": prefs,
    }


async def update_perfil(db: AsyncSession, user_id: int, data) -> Usuario:
    """Update user profile (name, email)."""
    user = await _get_user_by_id(db, user_id)
    if not user:
        raise ValueError("NOT_FOUND")

    if data.nombre_completo is not None:
        user.nombre_completo = data.nombre_completo

    if data.email is not None:
        # Check email uniqueness
        email_check = await db.execute(
            select(Usuario).where(Usuario.email == data.email, Usuario.id != user_id)
        )
        if email_check.scalar_one_or_none():
            raise ValueError("EMAIL_EXISTS")
        user.email = data.email

    user.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()

    # Re-fetch with relationships
    result2 = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.tokens_sesion),
            selectinload(Usuario.preferencias),
        )
        .where(Usuario.id == user_id)
    )
    fresh_user = result2.scalar_one()

    await db.commit()
    return fresh_user


async def change_password(db: AsyncSession, user_id: int, current_password: str, new_password: str, confirm_password: str) -> dict:
    """Change user password."""
    if new_password != confirm_password:
        raise ValueError("PASSWORDS_DONT_MATCH")

    user = await _get_user_by_id(db, user_id)
    if not user:
        raise ValueError("NOT_FOUND")

    if not verify_password(current_password, user.password_hash):
        raise ValueError("INVALID_CURRENT_PASSWORD")

    user.password_hash = hash_password(new_password)
    user.fecha_actualizacion = datetime.now(timezone.utc)
    await db.commit()

    return {"mensaje": "Contraseña cambiada exitosamente."}


async def get_preferencias(db: AsyncSession, user_id: int) -> PreferenciasUsuario:
    """Get user preferences."""
    result = await db.execute(
        select(PreferenciasUsuario).where(PreferenciasUsuario.usuario_id == user_id)
    )
    prefs = result.scalar_one_or_none()
    if not prefs:
        prefs = PreferenciasUsuario(
            usuario_id=user_id,
            idioma="es",
            tema_visual="light",
            zona_horaria="America/Mexico_City",
        )
        db.add(prefs)
        await db.commit()

    return prefs


async def update_preferencias(db: AsyncSession, user_id: int, data) -> PreferenciasUsuario:
    """Update user preferences."""
    result = await db.execute(
        select(PreferenciasUsuario).where(PreferenciasUsuario.usuario_id == user_id)
    )
    prefs = result.scalar_one_or_none()
    if not prefs:
        prefs = PreferenciasUsuario(
            usuario_id=user_id,
            idioma="es",
            tema_visual="light",
            zona_horaria="America/Mexico_City",
        )
        db.add(prefs)
        await db.flush()

    if data.idioma is not None:
        prefs.idioma = data.idioma
    if data.tema_visual is not None:
        prefs.tema_visual = data.tema_visual
    if data.zona_horaria is not None:
        prefs.zona_horaria = data.zona_horaria

    await db.commit()
    return prefs
