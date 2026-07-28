from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from config import ROLES

from .models import (
    ConfiguracionNegocio,
    PreferenciasUsuario,
    Rol,
    TokenRestablecimiento,
    TokenSesion,
    Usuario,
)
from .schemas import (
    PreferenciasOut,
    SetupRequest,
    UserCreateRequest,
    UserUpdateRequest,
    UserOut,
)
from .utils import (
    create_jwt_token,
    generate_reset_token,
    generate_session_token,
    get_reset_token_expiry,
    hash_password,
    hash_token,
    verify_password,
)

# ─── Helpers ─────────────────────────────────────────────────────────────────

async def _get_user_out(db: AsyncSession, user: Usuario) -> UserOut:
    """Build a UserOut from a user that has eager-loaded relationships."""
    return UserOut(
        id=user.id,
        nombre_completo=user.nombre_completo,
        email=user.email,
        rol=user.rol.nombre if hasattr(user.rol, "nombre") else str(user.rol),
        activo=user.activo,
        fecha_creacion=user.fecha_creacion,
        ultimo_acceso=None,
    )


async def _get_user_by_id(db: AsyncSession, user_id: int) -> Optional[Usuario]:
    """Fetch user by ID with eager-loaded relationships."""
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
    """Fetch user by email with eager-loaded relationships."""
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


async def _get_or_create_rol(db: AsyncSession, rol_nombre: str) -> Rol:
    """Get existing role or create it."""
    result = await db.execute(select(Rol).where(Rol.nombre == rol_nombre))
    rol = result.scalar_one_or_none()
    if rol is None:
        desc = ROLES.get(rol_nombre, "")
        rol = Rol(nombre=rol_nombre, descripcion=desc)
        db.add(rol)
        await db.flush()
    return rol


def _validate_rol(rol: str) -> str:
    """Validate and normalize role name."""
    normalized = rol.lower().strip()
    valid_roles = {"administrador", "vendedor", "almacen"}
    if normalized not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rol inválido. Los roles válidos son: {', '.join(sorted(valid_roles))}",
        )
    return normalized


# ─── Setup ───────────────────────────────────────────────────────────────────

async def check_setup_status(db: AsyncSession) -> dict:
    """Check if setup has been completed and if an admin exists."""
    result = await db.execute(
        select(ConfiguracionNegocio).where(ConfiguracionNegocio.setup_completado == True)
    )
    config = result.scalar_one_or_none()
    setup_completed = config is not None

    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .join(Rol, Usuario.rol_id == Rol.id)
        .where(Rol.nombre == "administrador")
        .limit(1)
    )
    admin = result.scalar_one_or_none()
    admin_exists = admin is not None

    return {"setup_completed": setup_completed, "admin_exists": admin_exists}


async def run_setup(db: AsyncSession, data: SetupRequest) -> dict:
    """Execute the initial setup wizard: create admin user and business config."""
    # Check if setup already completed
    status_data = await check_setup_status(db)
    if status_data["setup_completed"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La configuración inicial ya ha sido completada",
        )

    # Check if email already in use
    existing = await _get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado",
        )

    # Get or create admin role
    rol = await _get_or_create_rol(db, "administrador")

    # Create admin user
    password_hashed = hash_password(data.password)
    user = Usuario(
        nombre_completo=data.nombre_completo,
        email=data.email,
        password_hash=password_hashed,
        rol_id=rol.id,
        activo=True,
    )
    db.add(user)
    await db.flush()

    # Create default preferences
    prefs = PreferenciasUsuario(
        usuario_id=user.id,
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
    )
    db.add(config)
    await db.flush()

    # Refresh to load relationships
    await db.refresh(user, ["rol", "preferencias", "tokens_sesion"])

    user_out = await _get_user_out(db, user)

    return {
        "mensaje": "Configuración inicial completada exitosamente",
        "usuario": user_out,
    }


# ─── Authentication ─────────────────────────────────────────────────────────

async def login_user(db: AsyncSession, email: str, password: str, remember: bool) -> dict:
    """Authenticate a user and return a token."""
    user = await _get_user_by_email(db, email)

    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )

    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario desactivado. Contacte al administrador.",
        )

    # Generate JWT and session token
    jwt_token, expires_in = create_jwt_token(user.id, remember=remember)
    session_token = generate_session_token()
    token_hashed = hash_token(jwt_token)

    # Store session token in DB
    expiry = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

    db_token = TokenSesion(
        usuario_id=user.id,
        token_hash=token_hashed,
        es_persistente=remember,
        fecha_expiracion=expiry,
        activo=True,
    )
    db.add(db_token)
    await db.flush()

    # Update ultimo_acceso
    user.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()

    user_out = await _get_user_out(db, user)

    return {
        "token": jwt_token,
        "token_type": "bearer",
        "expires_in": expires_in,
        "usuario": user_out,
    }


async def logout_user(db: AsyncSession, token: str) -> dict:
    """Invalidate the session token."""
    token_hashed = hash_token(token)
    result = await db.execute(
        select(TokenSesion).where(TokenSesion.token_hash == token_hashed)
    )
    db_token = result.scalar_one_or_none()
    if db_token:
        db_token.activo = False
        await db.flush()

    return {"mensaje": "Sesión cerrada exitosamente"}


# ─── Password Recovery ──────────────────────────────────────────────────────

async def forgot_password(db: AsyncSession, email: str) -> dict:
    """Generate a reset token for the user (always returns success to prevent email enumeration)."""
    user = await _get_user_by_email(db, email)
    if user is not None:
        token = generate_reset_token()
        token_hashed = hash_token(token)

        reset_token = TokenRestablecimiento(
            usuario_id=user.id,
            token_hash=token_hashed,
            fecha_expiracion=get_reset_token_expiry(),
            utilizado=False,
        )
        db.add(reset_token)
        await db.flush()

        # In a real app, send email here with the token
        # For MVP, we just store the token

    # Always return success to prevent email enumeration
    return {
        "mensaje": "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña"
    }


async def verify_reset_token(db: AsyncSession, token: str) -> dict:
    """Verify if a reset token is valid."""
    token_hashed = hash_token(token)
    result = await db.execute(
        select(TokenRestablecimiento)
        .options(selectinload(TokenRestablecimiento.usuario))
        .where(TokenRestablecimiento.token_hash == token_hashed)
    )
    reset_token = result.scalar_one_or_none()

    if reset_token is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token no encontrado",
        )

    if reset_token.utilizado:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="El token ya ha sido utilizado",
        )

    if datetime.now(timezone.utc) > reset_token.fecha_expiracion:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="El token ha expirado",
        )

    return {
        "valido": True,
        "email": reset_token.usuario.email,
    }


async def reset_password(db: AsyncSession, token: str, new_password: str, confirm_password: str) -> dict:
    """Reset the user's password using a valid reset token."""
    if new_password != confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas no coinciden",
        )

    token_hashed = hash_token(token)
    result = await db.execute(
        select(TokenRestablecimiento)
        .options(selectinload(TokenRestablecimiento.usuario))
        .where(TokenRestablecimiento.token_hash == token_hashed)
    )
    reset_token = result.scalar_one_or_none()

    if reset_token is None or reset_token.utilizado:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Token inválido o ya utilizado",
        )

    if datetime.now(timezone.utc) > reset_token.fecha_expiracion:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="El token ha expirado",
        )

    # Update password
    reset_token.usuario.password_hash = hash_password(new_password)
    reset_token.utilizado = True
    await db.flush()

    # Invalidate all session tokens for this user
    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.usuario_id == reset_token.usuario_id,
            TokenSesion.activo == True,
        )
    )
    active_tokens = result.scalars().all()
    for t in active_tokens:
        t.activo = False
    await db.flush()

    return {"mensaje": "Contraseña restablecida exitosamente"}


# ─── User Management ────────────────────────────────────────────────────────

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

    # Count query (without pagination)
    count_query = select(func.count(Usuario.id))

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            Usuario.nombre_completo.ilike(search_pattern) |
            Usuario.email.ilike(search_pattern)
        )
        count_query = count_query.where(
            Usuario.nombre_completo.ilike(search_pattern) |
            Usuario.email.ilike(search_pattern)
        )

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.order_by(Usuario.id).offset(offset).limit(page_size)

    result = await db.execute(query)
    users = result.scalars().all()

    total_pages = max(1, (total + page_size - 1) // page_size)

    items = [await _get_user_out(db, u) for u in users]

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
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    return user


async def create_usuario(db: AsyncSession, data: UserCreateRequest) -> Usuario:
    """Create a new user."""
    # Validate role
    rol_nombre = _validate_rol(data.rol)

    # Check email uniqueness
    existing = await _get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo electrónico ya está registrado",
        )

    # Get or create role
    rol = await _get_or_create_rol(db, rol_nombre)

    # Create user
    password_hashed = hash_password(data.password)
    user = Usuario(
        nombre_completo=data.nombre_completo,
        email=data.email,
        password_hash=password_hashed,
        rol_id=rol.id,
        activo=True,
    )
    db.add(user)
    await db.flush()

    # Create default preferences
    prefs = PreferenciasUsuario(
        usuario_id=user.id,
        idioma="es",
        tema_visual="light",
        configuracion_regional="es-MX",
    )
    db.add(prefs)
    await db.flush()

    # Refresh to load relationships
    await db.refresh(user, ["rol", "preferencias", "tokens_sesion"])

    return user


async def update_usuario(db: AsyncSession, user_id: int, data: UserUpdateRequest) -> Usuario:
    """Update an existing user."""
    user = await _get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    if data.nombre_completo is not None:
        user.nombre_completo = data.nombre_completo

    if data.email is not None:
        # Check email uniqueness (exclude current user)
        existing = await _get_user_by_email(db, data.email)
        if existing is not None and existing.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El correo electrónico ya está registrado",
            )
        user.email = data.email

    if data.rol is not None:
        rol_nombre = _validate_rol(data.rol)
        rol = await _get_or_create_rol(db, rol_nombre)
        user.rol_id = rol.id

    user.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()

    # Refresh to load relationships
    await db.refresh(user, ["rol", "preferencias", "tokens_sesion"])

    return user


async def deactivate_usuario(db: AsyncSession, user_id: int, current_user_id: int) -> Usuario:
    """Deactivate a user."""
    if user_id == current_user_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No puedes desactivar tu propia cuenta",
        )

    user = await _get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    user.activo = False
    user.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()

    # Invalidate all active session tokens
    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.usuario_id == user_id,
            TokenSesion.activo == True,
        )
    )
    active_tokens = result.scalars().all()
    for t in active_tokens:
        t.activo = False
    await db.flush()

    await db.refresh(user, ["rol", "preferencias", "tokens_sesion"])

    return user


async def reactivate_usuario(db: AsyncSession, user_id: int) -> Usuario:
    """Reactivate a user."""
    user = await _get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    user.activo = True
    user.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()

    await db.refresh(user, ["rol", "preferencias", "tokens_sesion"])

    return user


# ─── Profile ─────────────────────────────────────────────────────────────────

async def get_perfil(db: AsyncSession, user: Usuario) -> dict:
    """Get user profile with preferences."""
    # Load preferences if not loaded
    prefs = user.preferencias
    if prefs is None:
        # Create default preferences
        prefs = PreferenciasUsuario(
            usuario_id=user.id,
            idioma="es",
            tema_visual="light",
            configuracion_regional="es-MX",
        )
        db.add(prefs)
        await db.flush()
        await db.refresh(user, ["preferencias"])
        prefs = user.preferencias

    return {
        "usuario": await _get_user_out(db, user),
        "preferencias": PreferenciasOut(
            idioma=prefs.idioma,
            tema_visual=prefs.tema_visual,
            zona_horaria=prefs.configuracion_regional,
        ),
    }


async def update_perfil(db: AsyncSession, user: Usuario, nombre_completo: Optional[str], email: Optional[str]) -> Usuario:
    """Update user's own profile."""
    if nombre_completo is not None:
        user.nombre_completo = nombre_completo

    if email is not None:
        # Check email uniqueness (exclude current user)
        existing = await _get_user_by_email(db, email)
        if existing is not None and existing.id != user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El correo electrónico ya está registrado",
            )
        user.email = email

    user.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()

    await db.refresh(user, ["rol", "preferencias", "tokens_sesion"])

    return user


async def change_password(
    db: AsyncSession,
    user: Usuario,
    current_password: str,
    new_password: str,
    confirm_password: str,
) -> dict:
    """Change user's own password."""
    # Verify current password
    if not verify_password(current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta",
        )

    if new_password != confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas nuevas no coinciden",
        )

    if new_password == current_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe ser diferente a la actual",
        )

    user.password_hash = hash_password(new_password)
    user.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()

    # Invalidate all other session tokens except current
    # (Keep current session alive)
    await db.refresh(user, ["tokens_sesion"])

    return {"mensaje": "Contraseña cambiada exitosamente"}


async def get_preferencias(db: AsyncSession, user: Usuario) -> PreferenciasOut:
    """Get user preferences."""
    prefs = user.preferencias
    if prefs is None:
        return PreferenciasOut()
    return PreferenciasOut(
        idioma=prefs.idioma,
        tema_visual=prefs.tema_visual,
        zona_horaria=prefs.configuracion_regional,
    )


async def update_preferencias(
    db: AsyncSession,
    user: Usuario,
    idioma: Optional[str],
    tema_visual: Optional[str],
    zona_horaria: Optional[str],
) -> PreferenciasOut:
    """Update user preferences."""
    prefs = user.preferencias
    if prefs is None:
        prefs = PreferenciasUsuario(usuario_id=user.id)
        db.add(prefs)
        await db.flush()

    if idioma is not None:
        prefs.idioma = idioma
    if tema_visual is not None:
        prefs.tema_visual = tema_visual
    if zona_horaria is not None:
        prefs.configuracion_regional = zona_horaria

    await db.flush()

    await db.refresh(user, ["preferencias"])

    return PreferenciasOut(
        idioma=prefs.idioma,
        tema_visual=prefs.tema_visual,
        zona_horaria=prefs.configuracion_regional,
    )
