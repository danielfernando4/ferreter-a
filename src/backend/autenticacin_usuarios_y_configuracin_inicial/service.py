from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, func, or_, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from autenticacin_usuarios_y_configuracin_inicial.models import (
    Usuario, Rol, ConfiguracionNegocio, PreferenciasUsuario,
    TokenSesion, TokenRestablecimiento,
)
from autenticacin_usuarios_y_configuracin_inicial.schemas import (
    UserOut, SetupResponse, LoginResponse, PreferenciasOut,
    PaginatedUsersResponse, UserActionResponse, PerfilResponse,
    ChangePasswordResponse, ResetPasswordResponse, ForgotPasswordResponse,
    LogoutResponse, VerifyTokenResponse,
)
from autenticacin_usuarios_y_configuracin_inicial.utils import (
    hash_password, verify_password, create_access_token,
    generate_reset_token, hash_token, get_reset_token_expiry,
    decode_access_token,
)


# ────────────────────────────
# Helper: build UserOut with safe relationship access
# ────────────────────────────

async def _get_user_out(db: AsyncSession, user: Usuario) -> UserOut:
    """Build a UserOut from a Usuario object, ensuring relationships are loaded."""
    # If rol is not loaded, refresh
    if user.rol is None:
        await db.refresh(user, ["rol"])
    return UserOut.model_validate(user)


async def _get_user_with_relations(db: AsyncSession, user_id: int) -> Optional[Usuario]:
    """Fetch a user by ID with all relationships eager-loaded."""
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
    """Fetch a user by email with all relationships eager-loaded."""
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


# ────────────────────────────
# Setup
# ────────────────────────────

async def check_setup_status(db: AsyncSession) -> dict:
    """Check if setup has been completed and if admin exists."""
    # Check if any ConfiguracionNegocio has setup_completado=True
    result = await db.execute(
        select(func.count(ConfiguracionNegocio.id)).where(
            ConfiguracionNegocio.setup_completado == True
        )
    )
    setup_count = result.scalar() or 0
    setup_completed = setup_count > 0

    # Check if admin rol exists and any user has that role
    admin_rol_result = await db.execute(
        select(Rol).where(Rol.nombre == "administrador")
    )
    admin_rol = admin_rol_result.scalar_one_or_none()

    admin_exists = False
    if admin_rol is not None:
        result = await db.execute(
            select(func.count(Usuario.id)).where(
                Usuario.rol_id == admin_rol.id,
                Usuario.activo == True,
            )
        )
        admin_count = result.scalar() or 0
        admin_exists = admin_count > 0

    return {"setup_completed": setup_completed, "admin_exists": admin_exists}


async def run_setup(db: AsyncSession, data: dict) -> SetupResponse:
    """Execute the initial setup wizard. Creates admin role, admin user, and business config."""
    # Verify setup not already completed
    status = await check_setup_status(db)
    if status["setup_completed"] or status["admin_exists"]:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="SETUP_ALREADY_COMPLETED")

    # Ensure roles exist
    roles_data = [
        {"nombre": "administrador", "descripcion": "Acceso completo al sistema. Puede gestionar usuarios, configuraciones y todos los módulos."},
        {"nombre": "vendedor", "descripcion": "Acceso al módulo de punto de venta y consulta de productos, clientes y reportes básicos."},
        {"nombre": "almacen", "descripcion": "Acceso al módulo de inventario, órdenes de compra y consulta de productos."},
    ]

    roles = {}
    for r_data in roles_data:
        existing = await db.execute(select(Rol).where(Rol.nombre == r_data["nombre"]))
        rol = existing.scalar_one_or_none()
        if rol is None:
            rol = Rol(**r_data)
            db.add(rol)
            await db.flush()
        roles[rol.nombre] = rol

    admin_rol = roles["administrador"]

    # Create admin user
    password_hash = hash_password(data["password"])
    new_user = Usuario(
        nombre_completo=data["nombre_completo"],
        email=data["email"],
        password_hash=password_hash,
        activo=True,
        rol_id=admin_rol.id,
        ultimo_acceso=datetime.now(timezone.utc),
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

    # Create business configuration
    negocio = ConfiguracionNegocio(
        nombre=data["negocio_nombre"],
        direccion=data["negocio_direccion"],
        datos_fiscales=data["negocio_rfc"],
        telefono=data.get("negocio_telefono"),
        setup_completado=True,
    )
    db.add(negocio)
    await db.flush()

    # Refresh relationships for serialization
    await db.refresh(new_user, ["rol", "preferencias", "tokens_sesion"])

    user_out = UserOut.model_validate(new_user)
    return SetupResponse(mensaje="Configuración inicial completada exitosamente", usuario=user_out)


# ────────────────────────────
# Authentication
# ────────────────────────────

async def login(db: AsyncSession, email: str, password: str, remember: bool = False) -> LoginResponse:
    """Authenticate a user and return a session token."""
    from fastapi import HTTPException, status

    user = await _get_user_by_email(db, email)

    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="INVALID_CREDENTIALS",
        )

    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="INVALID_CREDENTIALS",
        )

    # Update ultimo_acceso
    user.ultimo_acceso = datetime.now(timezone.utc)

    # Create JWT token
    token, expires_in = create_access_token(user.id, remember=remember)

    # Store session token in DB
    token_hash_val = hash_token(token)
    from datetime import timedelta
    if remember:
        expire_dt = datetime.now(timezone.utc) + timedelta(days=30)
    else:
        expire_dt = datetime.now(timezone.utc) + timedelta(minutes=60)

    session_token = TokenSesion(
        usuario_id=user.id,
        token_hash=token_hash_val,
        es_persistente=remember,
        fecha_expiracion=expire_dt,
        activo=True,
    )
    db.add(session_token)
    await db.flush()

    await db.refresh(user, ["rol", "preferencias", "tokens_sesion"])
    user_out = UserOut.model_validate(user)

    return LoginResponse(
        token=token,
        token_type="bearer",
        expires_in=expires_in,
        usuario=user_out,
    )


async def logout(db: AsyncSession, token_str: str) -> LogoutResponse:
    """Invalidate the session token."""
    token_hashed = hash_token(token_str)
    result = await db.execute(
        select(TokenSesion).where(TokenSesion.token_hash == token_hashed)
    )
    db_token = result.scalar_one_or_none()
    if db_token:
        db_token.activo = False
        await db.flush()

    return LogoutResponse(mensaje="Sesión cerrada exitosamente")


async def get_me(db: AsyncSession, user: Usuario) -> UserOut:
    """Get current user profile."""
    return await _get_user_out(db, user)


# ────────────────────────────
# Password recovery
# ────────────────────────────

async def forgot_password(db: AsyncSession, email: str) -> ForgotPasswordResponse:
    """Generate a password reset token for the given email."""
    user = await _get_user_by_email(db, email)

    if user is not None:
        # Generate reset token
        raw_token = generate_reset_token()
        token_hash_val = hash_token(raw_token)
        expiry = get_reset_token_expiry()

        reset_token = TokenRestablecimiento(
            usuario_id=user.id,
            token_hash=token_hash_val,
            fecha_expiracion=expiry,
            utilizado=False,
        )
        db.add(reset_token)
        await db.flush()

        # In a real app, send email here. For MVP, we just store the token.
        # The frontend will redirect to reset-password/{raw_token}

    # Always return success to prevent email enumeration
    return ForgotPasswordResponse(mensaje="Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.")


async def verify_reset_token(db: AsyncSession, token: str) -> VerifyTokenResponse:
    """Verify a password reset token is valid and not expired."""
    from fastapi import HTTPException, status

    token_hash_val = hash_token(token)
    result = await db.execute(
        select(TokenRestablecimiento).where(
            TokenRestablecimiento.token_hash == token_hash_val,
            TokenRestablecimiento.utilizado == False,
        )
    )
    reset_token = result.scalar_one_or_none()

    if reset_token is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="TOKEN_NOT_FOUND",
        )

    if datetime.now(timezone.utc) > reset_token.fecha_expiracion:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="TOKEN_EXPIRED",
        )

    # Fetch user to get email
    user = await _get_user_with_relations(db, reset_token.usuario_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="TOKEN_NOT_FOUND",
        )

    return VerifyTokenResponse(valido=True, email=user.email)


async def reset_password(db: AsyncSession, token: str, new_password: str, confirm_password: str) -> ResetPasswordResponse:
    """Reset a user's password using a valid reset token."""
    from fastapi import HTTPException, status

    if new_password != confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PASSWORDS_DONT_MATCH",
        )

    token_hash_val = hash_token(token)
    result = await db.execute(
        select(TokenRestablecimiento).where(
            TokenRestablecimiento.token_hash == token_hash_val,
            TokenRestablecimiento.utilizado == False,
        )
    )
    reset_token = result.scalar_one_or_none()

    if reset_token is None:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="TOKEN_INVALID_OR_EXPIRED",
        )

    if datetime.now(timezone.utc) > reset_token.fecha_expiracion:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="TOKEN_INVALID_OR_EXPIRED",
        )

    # Update password
    user = await _get_user_with_relations(db, reset_token.usuario_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="TOKEN_INVALID_OR_EXPIRED",
        )

    user.password_hash = hash_password(new_password)
    reset_token.utilizado = True

    # Invalidate all session tokens for this user
    await db.execute(
        update(TokenSesion)
        .where(TokenSesion.usuario_id == user.id)
        .values(activo=False)
    )

    await db.flush()

    return ResetPasswordResponse(mensaje="Contraseña restablecida exitosamente")


# ────────────────────────────
# User management (Admin)
# ────────────────────────────

async def list_usuarios(
    db: AsyncSession,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
) -> PaginatedUsersResponse:
    """List users with optional search and pagination."""
    query = select(Usuario).options(
        selectinload(Usuario.rol),
        selectinload(Usuario.tokens_sesion),
        selectinload(Usuario.preferencias),
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

    # Get paginated results
    offset = (page - 1) * page_size
    query = query.order_by(Usuario.fecha_creacion.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    users = result.scalars().all()

    items = [UserOut.model_validate(u) for u in users]

    return PaginatedUsersResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


async def get_usuario(db: AsyncSession, usuario_id: int) -> Optional[Usuario]:
    """Get a single user by ID with eager-loaded relationships."""
    return await _get_user_with_relations(db, usuario_id)


async def create_usuario(db: AsyncSession, data: dict) -> UserOut:
    """Create a new user with role assignment."""
    from fastapi import HTTPException, status

    # Check email uniqueness
    existing = await db.execute(select(Usuario).where(Usuario.email == data["email"]))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="EMAIL_EXISTS",
        )

    # Find role
    result = await db.execute(select(Rol).where(Rol.nombre == data["rol"]))
    rol = result.scalar_one_or_none()
    if rol is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="INVALID_DATA",
        )

    password_hash_val = hash_password(data["password"])
    new_user = Usuario(
        nombre_completo=data["nombre_completo"],
        email=data["email"],
        password_hash=password_hash_val,
        activo=True,
        rol_id=rol.id,
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
    await db.flush()

    # Refresh with relationships
    await db.refresh(new_user, ["rol", "preferencias", "tokens_sesion"])
    return UserOut.model_validate(new_user)


async def update_usuario(db: AsyncSession, usuario_id: int, data: dict) -> UserOut:
    """Update a user's profile fields (not password)."""
    from fastapi import HTTPException, status

    user = await _get_user_with_relations(db, usuario_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND",
        )

    # Check email uniqueness if changing email
    if "email" in data and data["email"] and data["email"] != user.email:
        existing = await db.execute(
            select(Usuario).where(Usuario.email == data["email"], Usuario.id != usuario_id)
        )
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="EMAIL_EXISTS",
            )
        user.email = data["email"]

    if "nombre_completo" in data and data["nombre_completo"]:
        user.nombre_completo = data["nombre_completo"]

    if "rol" in data and data["rol"]:
        result = await db.execute(select(Rol).where(Rol.nombre == data["rol"]))
        rol = result.scalar_one_or_none()
        if rol is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="INVALID_DATA",
            )
        user.rol_id = rol.id

    await db.flush()
    await db.refresh(user, ["rol", "preferencias", "tokens_sesion"])
    return UserOut.model_validate(user)


async def deactivate_usuario(db: AsyncSession, usuario_id: int, current_user_id: int) -> UserActionResponse:
    """Deactivate a user. Cannot deactivate yourself."""
    from fastapi import HTTPException, status

    if usuario_id == current_user_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="CANNOT_DEACTIVATE_SELF",
        )

    user = await _get_user_with_relations(db, usuario_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND",
        )

    user.activo = False

    # Invalidate all session tokens
    await db.execute(
        update(TokenSesion)
        .where(TokenSesion.usuario_id == usuario_id, TokenSesion.activo == True)
        .values(activo=False)
    )

    await db.flush()
    await db.refresh(user, ["rol", "preferencias", "tokens_sesion"])
    user_out = UserOut.model_validate(user)

    return UserActionResponse(mensaje="Usuario desactivado exitosamente", usuario=user_out)


async def reactivate_usuario(db: AsyncSession, usuario_id: int) -> UserActionResponse:
    """Reactivate a deactivated user."""
    from fastapi import HTTPException, status

    user = await _get_user_with_relations(db, usuario_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND",
        )

    user.activo = True
    await db.flush()
    await db.refresh(user, ["rol", "preferencias", "tokens_sesion"])
    user_out = UserOut.model_validate(user)

    return UserActionResponse(mensaje="Usuario reactivado exitosamente", usuario=user_out)


# ────────────────────────────
# Profile & Preferences
# ────────────────────────────

async def get_perfil(db: AsyncSession, user: Usuario) -> PerfilResponse:
    """Get current user's profile and preferences."""
    # Ensure preferences exist
    if user.preferencias is None:
        prefs = PreferenciasUsuario(
            usuario_id=user.id,
            idioma="es",
            tema_visual="light",
            configuracion_regional="es-MX",
        )
        db.add(prefs)
        await db.flush()
        await db.refresh(user, ["rol", "preferencias", "tokens_sesion"])

    user_out = UserOut.model_validate(user)
    prefs_out = PreferenciasOut.model_validate(user.preferencias)

    return PerfilResponse(usuario=user_out, preferencias=prefs_out)


async def update_perfil(db: AsyncSession, user: Usuario, data: dict) -> UserOut:
    """Update current user's profile (name, email)."""
    from fastapi import HTTPException, status

    if "email" in data and data["email"] and data["email"] != user.email:
        existing = await db.execute(
            select(Usuario).where(Usuario.email == data["email"], Usuario.id != user.id)
        )
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="EMAIL_EXISTS",
            )
        user.email = data["email"]

    if "nombre_completo" in data and data["nombre_completo"]:
        user.nombre_completo = data["nombre_completo"]

    await db.flush()
    await db.refresh(user, ["rol", "preferencias", "tokens_sesion"])
    return UserOut.model_validate(user)


async def change_password(
    db: AsyncSession,
    user: Usuario,
    current_password: str,
    new_password: str,
    confirm_password: str,
) -> ChangePasswordResponse:
    """Change current user's password."""
    from fastapi import HTTPException, status

    if new_password != confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PASSWORDS_DONT_MATCH",
        )

    if not verify_password(current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="INVALID_CURRENT_PASSWORD",
        )

    user.password_hash = hash_password(new_password)

    # Invalidate all other session tokens (keep current one)
    await db.execute(
        update(TokenSesion)
        .where(TokenSesion.usuario_id == user.id, TokenSesion.activo == True)
        .values(activo=False)
    )

    await db.flush()
    return ChangePasswordResponse(mensaje="Contraseña cambiada exitosamente")


async def get_preferencias(db: AsyncSession, user: Usuario) -> PreferenciasOut:
    """Get current user's preferences."""
    if user.preferencias is None:
        prefs = PreferenciasUsuario(
            usuario_id=user.id,
            idioma="es",
            tema_visual="light",
            configuracion_regional="es-MX",
        )
        db.add(prefs)
        await db.flush()
        await db.refresh(user, ["preferencias"])

    return PreferenciasOut.model_validate(user.preferencias)


async def update_preferencias(db: AsyncSession, user: Usuario, data: dict) -> PreferenciasOut:
    """Update current user's preferences."""
    if user.preferencias is None:
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

    if "idioma" in data and data["idioma"] is not None:
        prefs.idioma = data["idioma"]
    if "tema_visual" in data and data["tema_visual"] is not None:
        prefs.tema_visual = data["tema_visual"]
    if "zona_horaria" in data and data["zona_horaria"] is not None:
        # Map zona_horaria to configuracion_regional
        prefs.configuracion_regional = data["zona_horaria"]

    await db.flush()
    await db.refresh(user, ["preferencias"])
    return PreferenciasOut.model_validate(user.preferencias)
