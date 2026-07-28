from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import Base
from .models import Usuario, Rol, ConfiguracionNegocio, PreferenciasUsuario, TokenSesion, TokenRestablecimiento
from .schemas import (
    UserOut, UserCreateRequest, UserUpdateRequest,
    SetupRequest, LoginResponse, PaginatedUsersResponse,
    UserActionResponse, PerfilResponse, PreferenciasOut,
    ChangePasswordResponse, LogoutResponse, ForgotPasswordResponse,
    VerifyTokenResponse, ResetPasswordResponse,
)
from .utils import (
    hash_password, verify_password, create_access_token,
    generate_random_token, hash_token, create_reset_token,
)


# ─── Helper: Build UserOut ───

async def _get_user_out(db: AsyncSession, user_id: int) -> UserOut:
    """Fetch a user by ID with all relationships loaded and return UserOut."""
    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.preferencias),
            selectinload(Usuario.tokens_sesion),
        )
        .where(Usuario.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOT_FOUND")
    return UserOut.model_validate(user)


async def _build_user_out(user: Usuario) -> UserOut:
    """Build UserOut from an already-loaded Usuario object."""
    return UserOut.model_validate(user)


# ─── Setup ───

async def check_setup_status(db: AsyncSession):
    """Check if the setup wizard has been completed."""
    # Check if any admin exists
    admin_role_result = await db.execute(
        select(Rol).where(Rol.nombre == "administrador")
    )
    admin_role = admin_role_result.scalar_one_or_none()

    admin_exists = False
    if admin_role:
        result = await db.execute(
            select(Usuario).where(Usuario.rol_id == admin_role.id, Usuario.activo == True)
        )
        admin_exists = result.scalar_one_or_none() is not None

    # Check if setup has been completed in config
    config_result = await db.execute(
        select(ConfiguracionNegocio).where(ConfiguracionNegocio.setup_completado == True)
    )
    setup_completed = config_result.scalar_one_or_none() is not None

    return {"setup_completed": setup_completed, "admin_exists": admin_exists}


async def run_setup(db: AsyncSession, data: SetupRequest):
    """Execute the initial setup wizard."""
    # Verify setup not already completed
    config_result = await db.execute(
        select(ConfiguracionNegocio).where(ConfiguracionNegocio.setup_completado == True)
    )
    if config_result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="SETUP_ALREADY_COMPLETED",
        )

    # Check if admin role exists, create if not
    admin_role_result = await db.execute(
        select(Rol).where(Rol.nombre == "administrador")
    )
    admin_role = admin_role_result.scalar_one_or_none()
    if admin_role is None:
        admin_role = Rol(nombre="administrador", descripcion="Administrador del sistema con acceso completo")
        db.add(admin_role)

    # Ensure other roles exist too
    for rol_data in [
        ("vendedor", "Vendedor / Cajero con acceso al punto de venta"),
        ("almacen", "Encargado de almacén / compras con acceso a inventario"),
    ]:
        existing = await db.execute(select(Rol).where(Rol.nombre == rol_data[0]))
        if existing.scalar_one_or_none() is None:
            db.add(Rol(nombre=rol_data[0], descripcion=rol_data[1]))

    await db.flush()

    # Check if email already exists
    email_result = await db.execute(
        select(Usuario).where(Usuario.email == data.email)
    )
    if email_result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="INVALID_DATA",
        )

    # Create admin user
    new_user = Usuario(
        nombre_completo=data.nombre_completo,
        email=data.email,
        password_hash=hash_password(data.password),
        activo=True,
        rol_id=admin_role.id,
        fecha_creacion=datetime.now(timezone.utc),
        fecha_actualizacion=datetime.now(timezone.utc),
    )
    db.add(new_user)
    await db.flush()

    # Create default preferences
    preferencias = PreferenciasUsuario(
        usuario_id=new_user.id,
        idioma="es",
        tema_visual="light",
        configuracion_regional="es-MX",
    )
    db.add(preferencias)

    # Create business configuration
    negocio = ConfiguracionNegocio(
        nombre=data.negocio_nombre,
        direccion=data.negocio_direccion,
        datos_fiscales=data.negocio_rfc,
        telefono=data.negocio_telefono,
        email_contacto=data.email,
        setup_completado=True,
        fecha_creacion=datetime.now(timezone.utc),
    )
    db.add(negocio)
    await db.flush()

    # Refresh to load relationships for model_validate
    await db.refresh(new_user, ["rol", "preferencias", "tokens_sesion"])

    return SetupResponse(
        mensaje="Configuración inicial completada exitosamente",
        usuario=UserOut.model_validate(new_user),
    )


# ─── Login ───

async def login(db: AsyncSession, email: str, password: str, remember: bool = False):
    """Authenticate user and return token + user info."""
    # Find user by email
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.email == email, Usuario.activo == True)
    )
    user = result.scalar_one_or_none()

    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="INVALID_CREDENTIALS",
        )

    # Create a session token record
    raw_token = generate_random_token(48)
    token_hash_val = hash_token(raw_token)

    # Create JWT
    jwt_token, expires_in = create_access_token(
        data={"user_id": user.id, "token_hash": token_hash_val},
        remember=remember,
    )

    # Store in TokenSesion
    import hashlib
    from datetime import timedelta

    token_record = TokenSesion(
        usuario_id=user.id,
        token_hash=hashlib.sha256(jwt_token.encode("utf-8")).hexdigest(),
        es_persistente=remember,
        fecha_expiracion=datetime.now(timezone.utc) + timedelta(seconds=expires_in),
        fecha_creacion=datetime.now(timezone.utc),
        activo=True,
    )
    db.add(token_record)
    await db.flush()

    # Update ultimo_acceso
    user.ultimo_acceso = datetime.now(timezone.utc)
    await db.flush()

    # Refresh user for serialization
    await db.refresh(user, ["rol", "preferencias", "tokens_sesion"])

    return LoginResponse(
        token=jwt_token,
        token_type="bearer",
        expires_in=expires_in,
        usuario=UserOut.model_validate(user),
    )


# ─── Logout ───

async def logout(db: AsyncSession, current_user: Usuario, token_str: str):
    """Invalidate the current session token."""
    token_hash_val = hash_token(token_str)
    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.usuario_id == current_user.id,
            TokenSesion.activo == True,
        )
    )
    tokens = result.scalars().all()

    # Invalidate all tokens for this user (defensive)
    for t in tokens:
        t.activo = False
    await db.flush()

    return LogoutResponse(mensaje="Sesión cerrada exitosamente")


# ─── Get Current User Info ───

async def get_me(db: AsyncSession, current_user: Usuario) -> UserOut:
    """Return the current authenticated user's info."""
    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.preferencias),
            selectinload(Usuario.tokens_sesion),
        )
        .where(Usuario.id == current_user.id)
    )
    user = result.scalar_one()
    return UserOut.model_validate(user)


# ─── User Management ───

async def list_usuarios(
    db: AsyncSession,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
):
    """List users with pagination and optional search."""
    query = select(Usuario).options(
        selectinload(Usuario.rol),
        selectinload(Usuario.preferencias),
        selectinload(Usuario.tokens_sesion),
    )

    count_query = select(func.count(Usuario.id))

    if search:
        search_filter = or_(
            Usuario.nombre_completo.ilike(f"%{search}%"),
            Usuario.email.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    total_pages = max(1, (total + page_size - 1) // page_size)

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Usuario.id)

    result = await db.execute(query)
    users = result.scalars().all()

    return PaginatedUsersResponse(
        items=[UserOut.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


async def get_usuario(db: AsyncSession, user_id: int) -> UserOut:
    """Get a specific user by ID."""
    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.preferencias),
            selectinload(Usuario.tokens_sesion),
        )
        .where(Usuario.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOT_FOUND")
    return UserOut.model_validate(user)


async def create_usuario(db: AsyncSession, data: UserCreateRequest) -> UserOut:
    """Create a new user."""
    # Check email uniqueness
    email_result = await db.execute(select(Usuario).where(Usuario.email == data.email))
    if email_result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="EMAIL_EXISTS",
        )

    # Find role
    rol_result = await db.execute(select(Rol).where(Rol.nombre == data.rol))
    rol = rol_result.scalar_one_or_none()
    if rol is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="INVALID_DATA",
        )

    new_user = Usuario(
        nombre_completo=data.nombre_completo,
        email=data.email,
        password_hash=hash_password(data.password),
        activo=True,
        rol_id=rol.id,
        fecha_creacion=datetime.now(timezone.utc),
        fecha_actualizacion=datetime.now(timezone.utc),
    )
    db.add(new_user)
    await db.flush()

    # Create default preferences
    preferencias = PreferenciasUsuario(
        usuario_id=new_user.id,
        idioma="es",
        tema_visual="light",
        configuracion_regional="es-MX",
    )
    db.add(preferencias)
    await db.flush()

    await db.refresh(new_user, ["rol", "preferencias", "tokens_sesion"])
    return UserOut.model_validate(new_user)


async def update_usuario(db: AsyncSession, user_id: int, data: UserUpdateRequest) -> UserOut:
    """Update an existing user."""
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOT_FOUND")

    # Update fields
    if data.nombre_completo is not None:
        user.nombre_completo = data.nombre_completo

    if data.email is not None:
        # Check uniqueness
        email_result = await db.execute(
            select(Usuario).where(Usuario.email == data.email, Usuario.id != user_id)
        )
        if email_result.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="EMAIL_EXISTS",
            )
        user.email = data.email

    if data.rol is not None:
        rol_result = await db.execute(select(Rol).where(Rol.nombre == data.rol))
        rol = rol_result.scalar_one_or_none()
        if rol is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="INVALID_DATA",
            )
        user.rol_id = rol.id

    user.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()

    await db.refresh(user, ["rol", "preferencias", "tokens_sesion"])
    return UserOut.model_validate(user)


async def deactivate_usuario(db: AsyncSession, user_id: int, current_user: Usuario) -> UserActionResponse:
    """Deactivate a user."""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="CANNOT_DEACTIVATE_SELF",
        )

    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol), selectinload(Usuario.tokens_sesion))
        .where(Usuario.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOT_FOUND")

    user.activo = False
    user.fecha_actualizacion = datetime.now(timezone.utc)

    # Invalidate all tokens
    for token in user.tokens_sesion:
        token.activo = False

    await db.flush()
    await db.refresh(user, ["rol", "preferencias", "tokens_sesion"])

    return UserActionResponse(
        mensaje="Usuario desactivado exitosamente",
        usuario=UserOut.model_validate(user),
    )


async def reactivate_usuario(db: AsyncSession, user_id: int) -> UserActionResponse:
    """Reactivate a user."""
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOT_FOUND")

    user.activo = True
    user.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()

    await db.refresh(user, ["rol", "preferencias", "tokens_sesion"])
    return UserActionResponse(
        mensaje="Usuario reactivado exitosamente",
        usuario=UserOut.model_validate(user),
    )


# ─── Profile ───

async def get_perfil(db: AsyncSession, current_user: Usuario) -> PerfilResponse:
    """Get current user profile with preferences."""
    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.preferencias),
        )
        .where(Usuario.id == current_user.id)
    )
    user = result.scalar_one()

    pref = user.preferencias
    if pref is None:
        pref = PreferenciasUsuario(
            usuario_id=user.id,
            idioma="es",
            tema_visual="light",
            configuracion_regional="es-MX",
        )

    return PerfilResponse(
        usuario=UserOut.model_validate(user),
        preferencias=PreferenciasOut.model_validate(pref),
    )


async def update_perfil(db: AsyncSession, current_user: Usuario, nombre_completo: Optional[str], email: Optional[str]) -> UserOut:
    """Update current user's profile."""
    if nombre_completo is not None:
        current_user.nombre_completo = nombre_completo

    if email is not None:
        email_result = await db.execute(
            select(Usuario).where(Usuario.email == email, Usuario.id != current_user.id)
        )
        if email_result.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="EMAIL_EXISTS",
            )
        current_user.email = email

    current_user.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(current_user, ["rol", "preferencias", "tokens_sesion"])
    return UserOut.model_validate(current_user)


async def change_password(
    db: AsyncSession,
    current_user: Usuario,
    current_password: str,
    new_password: str,
    confirm_password: str,
) -> ChangePasswordResponse:
    """Change the current user's password."""
    if new_password != confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PASSWORDS_DONT_MATCH",
        )

    if not verify_password(current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="INVALID_CURRENT_PASSWORD",
        )

    current_user.password_hash = hash_password(new_password)
    current_user.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()

    return ChangePasswordResponse(mensaje="Contraseña actualizada exitosamente")


async def get_preferencias(db: AsyncSession, current_user: Usuario) -> PreferenciasOut:
    """Get current user's preferences."""
    result = await db.execute(
        select(PreferenciasUsuario).where(PreferenciasUsuario.usuario_id == current_user.id)
    )
    pref = result.scalar_one_or_none()

    if pref is None:
        pref = PreferenciasUsuario(
            usuario_id=current_user.id,
            idioma="es",
            tema_visual="light",
            configuracion_regional="es-MX",
        )
        db.add(pref)
        await db.flush()

    return PreferenciasOut.model_validate(pref)


async def update_preferencias(
    db: AsyncSession,
    current_user: Usuario,
    idioma: Optional[str],
    tema_visual: Optional[str],
    configuracion_regional: Optional[str],
) -> PreferenciasOut:
    """Update current user's preferences."""
    result = await db.execute(
        select(PreferenciasUsuario).where(PreferenciasUsuario.usuario_id == current_user.id)
    )
    pref = result.scalar_one_or_none()

    if pref is None:
        pref = PreferenciasUsuario(
            usuario_id=current_user.id,
            idioma="es",
            tema_visual="light",
            configuracion_regional="es-MX",
        )
        db.add(pref)
        await db.flush()

    if idioma is not None:
        pref.idioma = idioma
    if tema_visual is not None:
        pref.tema_visual = tema_visual
    if configuracion_regional is not None:
        pref.configuracion_regional = configuracion_regional

    await db.flush()
    return PreferenciasOut.model_validate(pref)


# ─── Password Reset ───

async def forgot_password(db: AsyncSession, email: str) -> ForgotPasswordResponse:
    """Initiate password reset process."""
    # Always return success to not reveal if email exists
    result = await db.execute(
        select(Usuario).where(Usuario.email == email, Usuario.activo == True)
    )
    user = result.scalar_one_or_none()

    if user is not None:
        # Invalidate any existing reset tokens for this user
        existing_tokens = await db.execute(
            select(TokenRestablecimiento).where(
                TokenRestablecimiento.usuario_id == user.id,
                TokenRestablecimiento.utilizado == False,
            )
        )
        for t in existing_tokens.scalars().all():
            t.utilizado = True

        # Create new reset token
        raw_token, hashed, expiration = create_reset_token()
        reset_token = TokenRestablecimiento(
            usuario_id=user.id,
            token_hash=hashed,
            fecha_expiracion=expiration,
            utilizado=False,
            fecha_creacion=datetime.now(timezone.utc),
        )
        db.add(reset_token)
        await db.flush()

    return ForgotPasswordResponse(
        mensaje="Si el correo está registrado, recibirás un enlace de recuperación"
    )


async def verify_reset_token(db: AsyncSession, token: str) -> VerifyTokenResponse:
    """Verify a reset token is still valid."""
    token_hash_val = hash_token(token)
    result = await db.execute(
        select(TokenRestablecimiento)
        .options(selectinload(TokenRestablecimiento.usuario))
        .where(TokenRestablecimiento.token_hash == token_hash_val)
    )
    reset_token = result.scalar_one_or_none()

    if reset_token is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="TOKEN_NOT_FOUND",
        )

    if reset_token.utilizado or reset_token.fecha_expiracion < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="TOKEN_EXPIRED",
        )

    return VerifyTokenResponse(
        valido=True,
        email=reset_token.usuario.email,
    )


async def reset_password(db: AsyncSession, token: str, new_password: str, confirm_password: str) -> ResetPasswordResponse:
    """Reset password using a valid reset token."""
    if new_password != confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PASSWORDS_DONT_MATCH",
        )

    token_hash_val = hash_token(token)
    result = await db.execute(
        select(TokenRestablecimiento)
        .options(selectinload(TokenRestablecimiento.usuario))
        .where(TokenRestablecimiento.token_hash == token_hash_val)
    )
    reset_token = result.scalar_one_or_none()

    if reset_token is None or reset_token.utilizado or reset_token.fecha_expiracion < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="TOKEN_INVALID_OR_EXPIRED",
        )

    # Update password
    reset_token.usuario.password_hash = hash_password(new_password)
    reset_token.usuario.fecha_actualizacion = datetime.now(timezone.utc)

    # Invalidate token
    reset_token.utilizado = True
    await db.flush()

    # Invalidate all session tokens for this user
    session_tokens = await db.execute(
        select(TokenSesion).where(
            TokenSesion.usuario_id == reset_token.usuario_id,
            TokenSesion.activo == True,
        )
    )
    for st in session_tokens.scalars().all():
        st.activo = False

    await db.flush()

    return ResetPasswordResponse(mensaje="Contraseña restablecida exitosamente")
