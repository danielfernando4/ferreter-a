from datetime import datetime, timezone
from typing import List, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy import select, func, or_
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
    PerfilResponse,
    PreferenciasOut,
    PreferenciasUpdateRequest,
    SetupRequest,
    UserCreateRequest,
    UserOut,
    UserUpdateRequest,
)
from .utils import (
    create_access_token,
    generate_reset_token,
    generate_session_token,
    hash_password,
    hash_token,
    verify_password,
)

# ─── Role Constants ──────────────────────────────────────────────────

ROLE_ADMIN = "administrador"
ROLE_VENDEDOR = "vendedor"
ROLE_ALMACEN = "almacen"
VALID_ROLES = [ROLE_ADMIN, ROLE_VENDEDOR, ROLE_ALMACEN]


# ─── Setup Check ─────────────────────────────────────────────────────

async def check_setup_status(db: AsyncSession) -> dict:
    """Check if setup has been completed and if any admin exists."""
    # Check if any admin user exists
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .join(Rol)
        .where(Rol.nombre == ROLE_ADMIN)
        .limit(1)
    )
    admin = result.scalar_one_or_none()

    # Check if business config exists with setup_completado=True
    result = await db.execute(
        select(ConfiguracionNegocio).where(
            ConfiguracionNegocio.setup_completado == True
        ).limit(1)
    )
    config = result.scalar_one_or_none()

    admin_exists = admin is not None
    setup_completed = config is not None

    return {
        "setup_completed": setup_completed,
        "admin_exists": admin_exists,
    }


# ─── Setup Wizard ────────────────────────────────────────────────────

async def run_setup(data: SetupRequest, db: AsyncSession) -> dict:
    """Execute the initial setup: create admin user, preferences, and business config."""
    # Verify setup not already completed
    result = await db.execute(
        select(ConfiguracionNegocio).where(
            ConfiguracionNegocio.setup_completado == True
        ).limit(1)
    )
    existing_config = result.scalar_one_or_none()
    if existing_config is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="SETUP_ALREADY_COMPLETED: La configuración inicial ya fue completada",
        )

    # Get or create admin role
    result = await db.execute(
        select(Rol).where(Rol.nombre == ROLE_ADMIN).limit(1)
    )
    admin_role = result.scalar_one_or_none()
    if admin_role is None:
        admin_role = Rol(nombre=ROLE_ADMIN, descripcion="Administrador del sistema con acceso completo")
        db.add(admin_role)
        await db.flush()

    # Get or create other roles
    for role_name, desc in [
        (ROLE_VENDEDOR, "Vendedor/Cajero con acceso al punto de venta"),
        (ROLE_ALMACEN, "Encargado de almacén/compras con acceso a inventario"),
    ]:
        result = await db.execute(
            select(Rol).where(Rol.nombre == role_name).limit(1)
        )
        existing = result.scalar_one_or_none()
        if existing is None:
            db.add(Rol(nombre=role_name, descripcion=desc))
    await db.flush()

    # Check if email already exists
    result = await db.execute(
        select(Usuario).where(Usuario.email == data.email).limit(1)
    )
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="INVALID_DATA: El correo electrónico ya está registrado",
        )

    # Create admin user
    now = datetime.now(timezone.utc)
    new_user = Usuario(
        nombre_completo=data.nombre_completo,
        email=data.email,
        password_hash=hash_password(data.password),
        activo=True,
        rol_id=admin_role.id,
        ultimo_acceso=None,
        fecha_creacion=now,
        fecha_actualizacion=now,
    )
    db.add(new_user)
    await db.flush()

    # Create default preferences for admin
    prefs = PreferenciasUsuario(
        usuario_id=new_user.id,
        idioma="es",
        tema_visual="light",
        configuracion_regional="es-MX",
    )
    db.add(prefs)
    await db.flush()

    # Create business config
    config = ConfiguracionNegocio(
        nombre=data.negocio_nombre,
        direccion=data.negocio_direccion,
        datos_fiscales=data.negocio_rfc,
        telefono=data.negocio_telefono,
        email_contacto=data.email,
        setup_completado=True,
        fecha_creacion=now,
    )
    db.add(config)
    await db.commit()

    # Refresh to load relationships for serialization
    await db.refresh(new_user, ["rol", "preferencias", "tokens_sesion"])

    return {
        "mensaje": "Configuración inicial completada exitosamente",
        "usuario": UserOut.model_validate(new_user),
    }


# ─── Authentication ──────────────────────────────────────────────────

async def login_user(email: str, password: str, remember: bool, db: AsyncSession) -> dict:
    """Authenticate user and return token + user data."""
    # Find user by email
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

    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )

    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cuenta de usuario desactivada",
        )

    # Create JWT token
    token, expires_in = create_access_token(user.id, user.email, user.rol.nombre, remember)

    # Store session token in DB
    token_hash_value = hash_token(token)
    now = datetime.now(timezone.utc)
    from config import REMEMBER_TOKEN_EXPIRE_DAYS, ACCESS_TOKEN_EXPIRE_MINUTES
    from datetime import timedelta

    expires_at = now + (timedelta(days=REMEMBER_TOKEN_EXPIRE_DAYS) if remember else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

    session_token = TokenSesion(
        usuario_id=user.id,
        token_hash=token_hash_value,
        es_persistente=remember,
        fecha_expiracion=expires_at,
        fecha_creacion=now,
        activo=True,
    )
    db.add(session_token)

    # Update ultimo_acceso
    user.ultimo_acceso = now
    await db.commit()
    await db.refresh(user, ["rol", "preferencias", "tokens_sesion"])

    return {
        "token": token,
        "token_type": "bearer",
        "expires_in": expires_in,
        "usuario": UserOut.model_validate(user),
    }


async def logout_user(user: Usuario, token: str, db: AsyncSession) -> dict:
    """Invalidate the current session token."""
    token_hash_value = hash_token(token)
    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.token_hash == token_hash_value,
            TokenSesion.usuario_id == user.id,
        )
    )
    db_token = result.scalar_one_or_none()
    if db_token:
        db_token.activo = False
        await db.commit()

    return {"mensaje": "Sesión cerrada exitosamente"}


# ─── Password Recovery ───────────────────────────────────────────────

async def forgot_password(email: str, db: AsyncSession) -> dict:
    """Generate a password reset token and return it (simulated email)."""
    result = await db.execute(
        select(Usuario).where(Usuario.email == email).limit(1)
    )
    user = result.scalar_one_or_none()

    # Always return success to not reveal existence of accounts
    if user is None:
        return {"mensaje": "Si el correo está registrado, recibirás un enlace de restablecimiento"}

    # Invalidate any existing reset tokens for this user
    result = await db.execute(
        select(TokenRestablecimiento).where(
            TokenRestablecimiento.usuario_id == user.id,
            TokenRestablecimiento.utilizado == False,
        )
    )
    existing_tokens = result.scalars().all()
    for t in existing_tokens:
        t.utilizado = True

    # Create new reset token
    raw_token = generate_reset_token()
    token_hash_value = hash_token(raw_token)
    now = datetime.now(timezone.utc)
    from config import RESET_TOKEN_EXPIRE_MINUTES
    from datetime import timedelta

    reset_token = TokenRestablecimiento(
        usuario_id=user.id,
        token_hash=token_hash_value,
        fecha_expiracion=now + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES),
        utilizado=False,
        fecha_creacion=now,
    )
    db.add(reset_token)
    await db.commit()

    # In a real app, send email with raw_token here
    # For MVP, we return the token in the response (for development/testing)
    return {
        "mensaje": "Si el correo está registrado, recibirás un enlace de restablecimiento",
        "_debug_token": raw_token,  # Only in development
    }


async def verify_reset_token(token: str, db: AsyncSession) -> dict:
    """Verify if a reset token is valid."""
    token_hash_value = hash_token(token)
    result = await db.execute(
        select(TokenRestablecimiento)
        .options(selectinload(TokenRestablecimiento.usuario))
        .where(
            TokenRestablecimiento.token_hash == token_hash_value,
            TokenRestablecimiento.utilizado == False,
        )
    )
    db_token = result.scalar_one_or_none()

    if db_token is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="TOKEN_NOT_FOUND",
        )

    now = datetime.now(timezone.utc)
    if now > db_token.fecha_expiracion:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="TOKEN_EXPIRED",
        )

    return {
        "valido": True,
        "email": db_token.usuario.email,
    }


async def reset_password(token: str, new_password: str, confirm_password: str, db: AsyncSession) -> dict:
    """Reset the password using a valid reset token."""
    if new_password != confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PASSWORDS_DONT_MATCH",
        )

    token_hash_value = hash_token(token)
    result = await db.execute(
        select(TokenRestablecimiento)
        .options(selectinload(TokenRestablecimiento.usuario))
        .where(
            TokenRestablecimiento.token_hash == token_hash_value,
            TokenRestablecimiento.utilizado == False,
        )
    )
    db_token = result.scalar_one_or_none()

    if db_token is None:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="TOKEN_INVALID_OR_EXPIRED",
        )

    now = datetime.now(timezone.utc)
    if now > db_token.fecha_expiracion:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="TOKEN_INVALID_OR_EXPIRED",
        )

    # Update password
    user = db_token.usuario
    user.password_hash = hash_password(new_password)

    # Invalidate token
    db_token.utilizado = True

    # Invalidate all session tokens for this user
    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.usuario_id == user.id,
            TokenSesion.activo == True,
        )
    )
    active_sessions = result.scalars().all()
    for session in active_sessions:
        session.activo = False

    await db.commit()

    return {"mensaje": "Contraseña restablecida exitosamente"}


# ─── User Management ─────────────────────────────────────────────────

async def list_usuarios(
    db: AsyncSession,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
) -> dict:
    """List users with pagination and optional search."""
    query = select(Usuario).options(
        selectinload(Usuario.rol),
        selectinload(Usuario.tokens_sesion),
        selectinload(Usuario.preferencias),
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

    # Paginate
    query = query.order_by(Usuario.fecha_creacion.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    users = result.scalars().all()

    items = [UserOut.model_validate(u) for u in users]
    total_pages = max(1, (total + page_size - 1) // page_size)

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


async def get_usuario(usuario_id: int, db: AsyncSession) -> Usuario:
    """Get a single user by ID with all relationships loaded."""
    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.tokens_sesion),
            selectinload(Usuario.preferencias),
        )
        .where(Usuario.id == usuario_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    return user


async def create_usuario(data: UserCreateRequest, db: AsyncSession) -> UserOut:
    """Create a new user."""
    # Validate role
    if data.rol not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"INVALID_DATA: Rol inválido. Debe ser uno de: {', '.join(VALID_ROLES)}",
        )

    # Check email uniqueness
    result = await db.execute(
        select(Usuario).where(Usuario.email == data.email).limit(1)
    )
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="EMAIL_EXISTS: El correo electrónico ya está registrado",
        )

    # Get role
    result = await db.execute(
        select(Rol).where(Rol.nombre == data.rol).limit(1)
    )
    role = result.scalar_one_or_none()
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"INVALID_DATA: Rol '{data.rol}' no encontrado en el sistema",
        )

    # Create user
    now = datetime.now(timezone.utc)
    new_user = Usuario(
        nombre_completo=data.nombre_completo,
        email=data.email,
        password_hash=hash_password(data.password),
        activo=True,
        rol_id=role.id,
        ultimo_acceso=None,
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
        configuracion_regional="es-MX",
    )
    db.add(prefs)
    await db.commit()

    # Refresh to load relationships
    await db.refresh(new_user, ["rol", "preferencias", "tokens_sesion"])

    return UserOut.model_validate(new_user)


async def update_usuario(usuario_id: int, data: UserUpdateRequest, db: AsyncSession) -> UserOut:
    """Update an existing user."""
    user = await get_usuario(usuario_id, db)

    # Update fields
    if data.nombre_completo is not None:
        user.nombre_completo = data.nombre_completo

    if data.email is not None:
        # Check email uniqueness
        result = await db.execute(
            select(Usuario).where(
                Usuario.email == data.email,
                Usuario.id != usuario_id,
            ).limit(1)
        )
        if result.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="EMAIL_EXISTS: El correo electrónico ya está registrado por otro usuario",
            )
        user.email = data.email

    if data.rol is not None:
        if data.rol not in VALID_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"INVALID_DATA: Rol inválido. Debe ser uno de: {', '.join(VALID_ROLES)}",
            )
        result = await db.execute(
            select(Rol).where(Rol.nombre == data.rol).limit(1)
        )
        role = result.scalar_one_or_none()
        if role is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"INVALID_DATA: Rol '{data.rol}' no encontrado",
            )
        user.rol_id = role.id

        # Invalidate all active sessions on role change
        result = await db.execute(
            select(TokenSesion).where(
                TokenSesion.usuario_id == usuario_id,
                TokenSesion.activo == True,
            )
        )
        active_sessions = result.scalars().all()
        for session in active_sessions:
            session.activo = False

    user.fecha_actualizacion = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user, ["rol", "preferencias", "tokens_sesion"])

    return UserOut.model_validate(user)


async def deactivate_usuario(usuario_id: int, current_user_id: int, db: AsyncSession) -> dict:
    """Deactivate a user account."""
    if usuario_id == current_user_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="CANNOT_DEACTIVATE_SELF: No puedes desactivar tu propia cuenta",
        )

    user = await get_usuario(usuario_id, db)
    user.activo = False
    user.fecha_actualizacion = datetime.now(timezone.utc)

    # Invalidate all active sessions
    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.usuario_id == usuario_id,
            TokenSesion.activo == True,
        )
    )
    active_sessions = result.scalars().all()
    for session in active_sessions:
        session.activo = False

    await db.commit()
    await db.refresh(user, ["rol", "preferencias", "tokens_sesion"])

    return {
        "mensaje": f"Usuario '{user.nombre_completo}' desactivado exitosamente",
        "usuario": UserOut.model_validate(user),
    }


async def reactivate_usuario(usuario_id: int, db: AsyncSession) -> dict:
    """Reactivate a deactivated user account."""
    user = await get_usuario(usuario_id, db)
    user.activo = True
    user.fecha_actualizacion = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(user, ["rol", "preferencias", "tokens_sesion"])

    return {
        "mensaje": f"Usuario '{user.nombre_completo}' reactivado exitosamente",
        "usuario": UserOut.model_validate(user),
    }


# ─── Profile Management ──────────────────────────────────────────────

async def get_perfil(user: Usuario, db: AsyncSession) -> PerfilResponse:
    """Get the profile of the current user."""
    # Ensure relationships are loaded
    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.tokens_sesion),
            selectinload(Usuario.preferencias),
        )
        .where(Usuario.id == user.id)
    )
    fresh_user = result.scalar_one()

    preferencias = fresh_user.preferencias
    if preferencias is None:
        preferencias = PreferenciasUsuario(
            usuario_id=fresh_user.id,
            idioma="es",
            tema_visual="light",
            configuracion_regional="es-MX",
        )

    return PerfilResponse(
        usuario=UserOut.model_validate(fresh_user),
        preferencias=PreferenciasOut.model_validate(preferencias),
    )


async def update_perfil(user: Usuario, nombre_completo: Optional[str], email: Optional[str], db: AsyncSession) -> UserOut:
    """Update the current user's profile."""
    # Re-fetch with relationships
    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.tokens_sesion),
            selectinload(Usuario.preferencias),
        )
        .where(Usuario.id == user.id)
    )
    fresh_user = result.scalar_one()

    if nombre_completo is not None:
        fresh_user.nombre_completo = nombre_completo

    if email is not None:
        # Check email uniqueness
        result = await db.execute(
            select(Usuario).where(
                Usuario.email == email,
                Usuario.id != user.id,
            ).limit(1)
        )
        if result.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="EMAIL_EXISTS: El correo electrónico ya está registrado",
            )
        fresh_user.email = email

    fresh_user.fecha_actualizacion = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(fresh_user, ["rol", "preferencias", "tokens_sesion"])

    return UserOut.model_validate(fresh_user)


async def change_password(
    user: Usuario,
    current_password: str,
    new_password: str,
    confirm_password: str,
    db: AsyncSession,
) -> dict:
    """Change the current user's password."""
    if new_password != confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PASSWORDS_DONT_MATCH",
        )

    # Re-fetch user
    result = await db.execute(
        select(Usuario).where(Usuario.id == user.id)
    )
    fresh_user = result.scalar_one()

    if not verify_password(current_password, fresh_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="INVALID_CURRENT_PASSWORD: La contraseña actual es incorrecta",
        )

    fresh_user.password_hash = hash_password(new_password)
    fresh_user.fecha_actualizacion = datetime.now(timezone.utc)
    await db.commit()

    return {"mensaje": "Contraseña cambiada exitosamente"}


# ─── Preferences Management ──────────────────────────────────────────

async def get_preferencias(user: Usuario, db: AsyncSession) -> PreferenciasOut:
    """Get the current user's preferences."""
    result = await db.execute(
        select(PreferenciasUsuario).where(
            PreferenciasUsuario.usuario_id == user.id
        )
    )
    prefs = result.scalar_one_or_none()

    if prefs is None:
        return PreferenciasOut()

    return PreferenciasOut.model_validate(prefs)


async def update_preferencias(
    user: Usuario,
    data: PreferenciasUpdateRequest,
    db: AsyncSession,
) -> PreferenciasOut:
    """Update the current user's preferences."""
    result = await db.execute(
        select(PreferenciasUsuario).where(
            PreferenciasUsuario.usuario_id == user.id
        )
    )
    prefs = result.scalar_one_or_none()

    if prefs is None:
        prefs = PreferenciasUsuario(usuario_id=user.id)
        db.add(prefs)

    if data.idioma is not None:
        prefs.idioma = data.idioma
    if data.tema_visual is not None:
        prefs.tema_visual = data.tema_visual
    if data.zona_horaria is not None:
        prefs.configuracion_regional = data.zona_horaria

    await db.commit()
    await db.refresh(prefs)

    return PreferenciasOut.model_validate(prefs)


# ─── Helper for UserOut Serialization ────────────────────────────────

async def _get_user_out(user: Usuario, db: AsyncSession) -> UserOut:
    """Safely serialize a user with relationships loaded."""
    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.tokens_sesion),
            selectinload(Usuario.preferencias),
        )
        .where(Usuario.id == user.id)
    )
    fresh_user = result.scalar_one()
    return UserOut.model_validate(fresh_user)
