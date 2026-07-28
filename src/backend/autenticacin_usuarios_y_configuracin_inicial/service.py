from datetime import datetime, timezone, timedelta
from typing import Optional, List, Tuple
from math import ceil

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from .models import Usuario, Rol, ConfiguracionNegocio, PreferenciasUsuario, TokenSesion, TokenRestablecimiento
from .schemas import (
    UserOut, UserCreateRequest, UserUpdateRequest, SetupRequest,
    PreferenciasOut, PreferenciasUpdateRequest,
    SetupResponse, LoginResponse, UserActionResponse,
    PaginatedUsersResponse, PerfilResponse,
    ForgotPasswordResponse, VerifyTokenResponse,
    ResetPasswordResponse, ChangePasswordResponse,
    LogoutResponse, SetupStatusResponse, ROLES_VALIDOS,
)
from .utils import (
    hash_password, verify_password,
    create_access_token, decode_access_token,
    generate_reset_token, hash_reset_token,
)

# ─── Helper ────────────────────────────────────────────────────────


def _get_rol_nombre(usuario: Usuario) -> str:
    """Safely extract rol name from user object."""
    if hasattr(usuario.rol, "nombre"):
        return usuario.rol.nombre
    return str(usuario.rol)


async def _get_user_out(usuario: Usuario, db: AsyncSession) -> UserOut:
    """Convert Usuario ORM to UserOut schema with safe relationship access."""
    # Ensure all needed relationships are loaded
    from sqlalchemy.orm import attributes
    if attributes.instance_state(usuario).unloaded_contains("rol"):
        await db.refresh(usuario, ["rol"])
    return UserOut.model_validate(usuario)


async def _get_preferencias_out(usuario: Usuario, db: AsyncSession) -> PreferenciasOut:
    """Get PreferenciasOut from user preferencias relationship or defaults."""
    from sqlalchemy.orm import attributes
    if attributes.instance_state(usuario).unloaded_contains("preferencias"):
        await db.refresh(usuario, ["preferencias"])

    pref = usuario.preferencias
    if pref is None:
        return PreferenciasOut()

    # Map configuracion_regional -> zona_horaria
    return PreferenciasOut(
        idioma=pref.idioma,
        tema_visual=pref.tema_visual,
        zona_horaria=pref.configuracion_regional,
    )


async def _get_or_create_preferencias(usuario_id: int, db: AsyncSession) -> PreferenciasUsuario:
    """Get existing preferencias or create defaults."""
    result = await db.execute(
        select(PreferenciasUsuario).where(PreferenciasUsuario.usuario_id == usuario_id)
    )
    pref = result.scalar_one_or_none()
    if pref is None:
        pref = PreferenciasUsuario(
            usuario_id=usuario_id,
            idioma="es",
            tema_visual="light",
            configuracion_regional="es-MX",
        )
        db.add(pref)
        await db.flush()
    return pref


async def _seed_roles(db: AsyncSession) -> dict:
    """Ensure the three predefined roles exist. Returns dict mapping name->id."""
    roles_data = {
        "administrador": "Acceso completo al sistema. Puede gestionar usuarios, productos, ventas, inventario y configuración.",
        "vendedor": "Acceso al punto de venta y consulta de productos, clientes y reportes básicos.",
        "almacen": "Acceso a inventario, órdenes de compra y productos. Sin acceso a ventas ni administración.",
    }
    result = {}
    for nombre, descripcion in roles_data.items():
        r = await db.execute(select(Rol).where(Rol.nombre == nombre))
        rol = r.scalar_one_or_none()
        if rol is None:
            rol = Rol(nombre=nombre, descripcion=descripcion)
            db.add(rol)
            await db.flush()
        result[nombre] = rol.id
    return result


# ═══════════════════════════════════════════════════════════════════
# SETUP
# ═══════════════════════════════════════════════════════════════════

async def check_setup(db: AsyncSession) -> SetupStatusResponse:
    """Check if setup has been completed and if an admin exists."""
    result = await db.execute(select(ConfiguracionNegocio).where(ConfiguracionNegocio.setup_completado == True))
    config_entry = result.scalar_one_or_none()

    result_admin = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.activo == True)
    )
    users = result_admin.scalars().all()
    admin_exists = False
    for u in users:
        if _get_rol_nombre(u) == "administrador":
            admin_exists = True
            break

    return SetupStatusResponse(
        setup_completed=config_entry is not None,
        admin_exists=admin_exists,
    )


async def run_setup(data: SetupRequest, db: AsyncSession) -> SetupResponse:
    """Execute the initial setup wizard: create admin user and business config."""
    # Check if setup already completed
    result = await db.execute(
        select(ConfiguracionNegocio).where(ConfiguracionNegocio.setup_completado == True)
    )
    existing_config = result.scalar_one_or_none()
    if existing_config is not None:
        from fastapi import HTTPException
        raise HTTPException(status_code=409, detail="La configuración inicial ya fue completada.")

    # Check if admin user already exists
    result_admin_check = await db.execute(
        select(Usuario).options(selectinload(Usuario.rol)).where(Usuario.activo == True)
    )
    existing_users = result_admin_check.scalars().all()
    for u in existing_users:
        if _get_rol_nombre(u) == "administrador":
            from fastapi import HTTPException
            raise HTTPException(status_code=409, detail="Ya existe un administrador registrado.")

    # Seed roles
    roles = await _seed_roles(db)

    # Create admin user
    password_hashed = hash_password(data.password)
    admin_user = Usuario(
        nombre_completo=data.nombre_completo,
        email=data.email,
        password_hash=password_hashed,
        activo=True,
        rol_id=roles["administrador"],
        fecha_creacion=datetime.now(timezone.utc),
        fecha_actualizacion=datetime.now(timezone.utc),
        ultimo_acceso=datetime.now(timezone.utc),
    )
    db.add(admin_user)
    await db.flush()

    # Create default preferencias for admin
    pref = PreferenciasUsuario(
        usuario_id=admin_user.id,
        idioma="es",
        tema_visual="light",
        configuracion_regional="es-MX",
    )
    db.add(pref)
    await db.flush()

    # Create business config
    config_entry = ConfiguracionNegocio(
        nombre=data.negocio_nombre,
        direccion=data.negocio_direccion,
        datos_fiscales=data.negocio_rfc,
        telefono=data.negocio_telefono,
        email_contacto=data.email,
        setup_completado=True,
        fecha_creacion=datetime.now(timezone.utc),
    )
    db.add(config_entry)
    await db.flush()

    # Refresh with all relationships for model_validate
    await db.refresh(admin_user, ["rol", "preferencias", "tokens_sesion"])
    user_out = UserOut.model_validate(admin_user)

    return SetupResponse(
        mensaje="Configuración inicial completada exitosamente.",
        usuario=user_out,
    )


# ═══════════════════════════════════════════════════════════════════
# LOGIN / LOGOUT
# ═══════════════════════════════════════════════════════════════════

async def login(email: str, password: str, remember: bool, db: AsyncSession) -> LoginResponse:
    """Authenticate user and return JWT token."""
    from fastapi import HTTPException

    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.tokens_sesion),
            selectinload(Usuario.preferencias),
        )
        .where(Usuario.email == email)
    )
    usuario = result.scalar_one_or_none()

    if usuario is None or not verify_password(password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    if not usuario.activo:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    # Update ultimo_acceso
    usuario.ultimo_acceso = datetime.now(timezone.utc)
    await db.flush()

    # Create JWT token
    token_data = create_access_token(usuario.id, remember=remember)

    user_out = UserOut.model_validate(usuario)

    return LoginResponse(
        token=token_data["token"],
        token_type=token_data["token_type"],
        expires_in=token_data["expires_in"],
        usuario=user_out,
    )


async def logout(token: str, db: AsyncSession) -> LogoutResponse:
    """Invalidate the current session token."""
    try:
        payload = decode_access_token(token)
    except ValueError:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    usuario_id = int(payload["sub"])
    # Invalidate any active token sessions for this user
    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.usuario_id == usuario_id,
            TokenSesion.activo == True,
        )
    )
    active_tokens = result.scalars().all()
    for t in active_tokens:
        t.activo = False
    await db.flush()

    return LogoutResponse(mensaje="Sesión cerrada exitosamente.")


# ═══════════════════════════════════════════════════════════════════
# PASSWORD RECOVERY
# ═══════════════════════════════════════════════════════════════════

async def forgot_password(email: str, db: AsyncSession) -> ForgotPasswordResponse:
    """Generate a password reset token and return success message (always generic)."""
    result = await db.execute(select(Usuario).where(Usuario.email == email))
    usuario = result.scalar_one_or_none()

    if usuario is not None:
        # Invalidate any existing unused tokens
        existing = await db.execute(
            select(TokenRestablecimiento).where(
                TokenRestablecimiento.usuario_id == usuario.id,
                TokenRestablecimiento.utilizado == False,
                TokenRestablecimiento.fecha_expiracion > datetime.now(timezone.utc),
            )
        )
        old_tokens = existing.scalars().all()
        for t in old_tokens:
            t.utilizado = True
        await db.flush()

        # Create new reset token
        raw_token = generate_reset_token()
        token_hash = hash_reset_token(raw_token)
        reset_entry = TokenRestablecimiento(
            usuario_id=usuario.id,
            token_hash=token_hash,
            fecha_expiracion=datetime.now(timezone.utc) + timedelta(hours=1),
            utilizado=False,
            fecha_creacion=datetime.now(timezone.utc),
        )
        db.add(reset_entry)
        await db.flush()

    # Always return generic success message
    return ForgotPasswordResponse(
        mensaje="Si el correo está registrado, recibirás un enlace de recuperación."
    )


async def verify_reset_token(token: str, db: AsyncSession) -> VerifyTokenResponse:
    """Verify if a reset token is valid and return the associated email."""
    from fastapi import HTTPException

    token_hash = hash_reset_token(token)
    result = await db.execute(
        select(TokenRestablecimiento)
        .options(selectinload(TokenRestablecimiento.usuario))
        .where(
            TokenRestablecimiento.token_hash == token_hash,
            TokenRestablecimiento.utilizado == False,
            TokenRestablecimiento.fecha_expiracion > datetime.now(timezone.utc),
        )
    )
    reset_entry = result.scalar_one_or_none()

    if reset_entry is None:
        # Check if token exists but expired
        result_expired = await db.execute(
            select(TokenRestablecimiento)
            .options(selectinload(TokenRestablecimiento.usuario))
            .where(TokenRestablecimiento.token_hash == token_hash)
        )
        expired_entry = result_expired.scalar_one_or_none()
        if expired_entry is not None:
            if expired_entry.fecha_expiracion <= datetime.now(timezone.utc):
                raise HTTPException(status_code=410, detail="El enlace de recuperación ha expirado.")
            raise HTTPException(status_code=404, detail="Token no encontrado.")
        raise HTTPException(status_code=404, detail="Token no encontrado.")

    email = reset_entry.usuario.email
    return VerifyTokenResponse(valido=True, email=email)


async def reset_password(token: str, new_password: str, confirm_password: str, db: AsyncSession) -> ResetPasswordResponse:
    """Reset password using a valid reset token."""
    from fastapi import HTTPException

    if new_password != confirm_password:
        raise HTTPException(status_code=400, detail="Las contraseñas no coinciden.")

    token_hash = hash_reset_token(token)
    result = await db.execute(
        select(TokenRestablecimiento)
        .options(selectinload(TokenRestablecimiento.usuario))
        .where(
            TokenRestablecimiento.token_hash == token_hash,
            TokenRestablecimiento.utilizado == False,
            TokenRestablecimiento.fecha_expiracion > datetime.now(timezone.utc),
        )
    )
    reset_entry = result.scalar_one_or_none()

    if reset_entry is None:
        raise HTTPException(status_code=410, detail="El enlace de recuperación es inválido o ha expirado.")

    # Update password
    usuario = reset_entry.usuario
    usuario.password_hash = hash_password(new_password)
    usuario.fecha_actualizacion = datetime.now(timezone.utc)

    # Invalidate token
    reset_entry.utilizado = True
    await db.flush()

    return ResetPasswordResponse(mensaje="Contraseña restablecida exitosamente.")


# ═══════════════════════════════════════════════════════════════════
# USERS CRUD
# ═══════════════════════════════════════════════════════════════════

async def get_me(usuario: Usuario, db: AsyncSession) -> UserOut:
    """Get the current authenticated user's profile."""
    return await _get_user_out(usuario, db)


async def list_usuarios(
    search: Optional[str],
    page: int,
    page_size: int,
    db: AsyncSession,
) -> PaginatedUsersResponse:
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

    # Get total count
    count_query = select(func.count(Usuario.id))
    if search:
        search_pattern = f"%{search}%"
        count_query = count_query.where(
            or_(
                Usuario.nombre_completo.ilike(search_pattern),
                Usuario.email.ilike(search_pattern),
            )
        )
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Get paginated results
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Usuario.id)
    result = await db.execute(query)
    usuarios = result.scalars().all()

    items = [UserOut.model_validate(u) for u in usuarios]
    total_pages = ceil(total / page_size) if total > 0 else 1

    return PaginatedUsersResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


async def get_usuario(usuario_id: int, db: AsyncSession) -> Usuario:
    """Get a single user by ID with eager loaded relationships."""
    from fastapi import HTTPException

    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.tokens_sesion),
            selectinload(Usuario.preferencias),
        )
        .where(Usuario.id == usuario_id)
    )
    usuario = result.scalar_one_or_none()
    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    return usuario


async def create_usuario(data: UserCreateRequest, db: AsyncSession) -> UserOut:
    """Create a new user."""
    from fastapi import HTTPException

    if data.rol not in ROLES_VALIDOS:
        raise HTTPException(status_code=400, detail=f"Rol inválido. Roles válidos: {', '.join(ROLES_VALIDOS)}")

    # Check email uniqueness
    existing = await db.execute(select(Usuario).where(Usuario.email == data.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="El correo electrónico ya está registrado.")

    # Ensure roles exist
    roles = await _seed_roles(db)

    password_hashed = hash_password(data.password)
    new_user = Usuario(
        nombre_completo=data.nombre_completo,
        email=data.email,
        password_hash=password_hashed,
        activo=True,
        rol_id=roles[data.rol],
        fecha_creacion=datetime.now(timezone.utc),
        fecha_actualizacion=datetime.now(timezone.utc),
    )
    db.add(new_user)
    await db.flush()

    # Create default preferencias
    pref = PreferenciasUsuario(
        usuario_id=new_user.id,
        idioma="es",
        tema_visual="light",
        configuracion_regional="es-MX",
    )
    db.add(pref)
    await db.flush()

    # Refresh with all relationships
    await db.refresh(new_user, ["rol", "preferencias", "tokens_sesion"])
    return UserOut.model_validate(new_user)


async def update_usuario(usuario_id: int, data: UserUpdateRequest, db: AsyncSession) -> UserOut:
    """Update an existing user."""
    from fastapi import HTTPException

    usuario = await get_usuario(usuario_id, db)

    if data.rol is not None and data.rol not in ROLES_VALIDOS:
        raise HTTPException(status_code=400, detail=f"Rol inválido. Roles válidos: {', '.join(ROLES_VALIDOS)}")

    # Check email uniqueness if changing
    if data.email is not None and data.email != usuario.email:
        existing = await db.execute(select(Usuario).where(Usuario.email == data.email))
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(status_code=409, detail="El correo electrónico ya está registrado.")

    if data.nombre_completo is not None:
        usuario.nombre_completo = data.nombre_completo
    if data.email is not None:
        usuario.email = data.email
    if data.rol is not None:
        roles = await _seed_roles(db)
        usuario.rol_id = roles[data.rol]

    usuario.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()

    await db.refresh(usuario, ["rol", "preferencias", "tokens_sesion"])
    return UserOut.model_validate(usuario)


async def deactivate_usuario(usuario_id: int, current_user: Usuario, db: AsyncSession) -> UserActionResponse:
    """Deactivate a user account."""
    from fastapi import HTTPException

    if usuario_id == current_user.id:
        raise HTTPException(status_code=409, detail="No puedes desactivar tu propia cuenta.")

    usuario = await get_usuario(usuario_id, db)
    if not usuario.activo:
        raise HTTPException(status_code=400, detail="El usuario ya está inactivo.")

    usuario.activo = False
    usuario.fecha_actualizacion = datetime.now(timezone.utc)

    # Invalidate all active tokens
    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.usuario_id == usuario_id,
            TokenSesion.activo == True,
        )
    )
    active_tokens = result.scalars().all()
    for t in active_tokens:
        t.activo = False

    await db.flush()
    await db.refresh(usuario, ["rol", "preferencias", "tokens_sesion"])

    return UserActionResponse(
        mensaje="Usuario desactivado exitosamente.",
        usuario=UserOut.model_validate(usuario),
    )


async def reactivate_usuario(usuario_id: int, db: AsyncSession) -> UserActionResponse:
    """Reactivate a deactivated user account."""
    from fastapi import HTTPException

    usuario = await get_usuario(usuario_id, db)
    if usuario.activo:
        raise HTTPException(status_code=400, detail="El usuario ya está activo.")

    usuario.activo = True
    usuario.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()

    await db.refresh(usuario, ["rol", "preferencias", "tokens_sesion"])

    return UserActionResponse(
        mensaje="Usuario reactivado exitosamente.",
        usuario=UserOut.model_validate(usuario),
    )


# ═══════════════════════════════════════════════════════════════════
# PERFIL
# ═══════════════════════════════════════════════════════════════════

async def get_perfil(usuario: Usuario, db: AsyncSession) -> PerfilResponse:
    """Get user profile with preferences."""
    user_out = await _get_user_out(usuario, db)
    pref_out = await _get_preferencias_out(usuario, db)
    return PerfilResponse(usuario=user_out, preferencias=pref_out)


async def update_perfil(usuario: Usuario, nombre_completo: Optional[str], email: Optional[str], db: AsyncSession) -> UserOut:
    """Update current user's profile."""
    from fastapi import HTTPException

    if email is not None and email != usuario.email:
        existing = await db.execute(select(Usuario).where(Usuario.email == email))
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(status_code=409, detail="El correo electrónico ya está registrado.")

    if nombre_completo is not None:
        usuario.nombre_completo = nombre_completo
    if email is not None:
        usuario.email = email

    usuario.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()

    await db.refresh(usuario, ["rol", "preferencias", "tokens_sesion"])
    return UserOut.model_validate(usuario)


async def change_password(
    usuario: Usuario,
    current_password: str,
    new_password: str,
    confirm_password: str,
    db: AsyncSession,
) -> ChangePasswordResponse:
    """Change the current user's password."""
    from fastapi import HTTPException

    if not verify_password(current_password, usuario.password_hash):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta.")

    if new_password != confirm_password:
        raise HTTPException(status_code=400, detail="Las contraseñas nuevas no coinciden.")

    usuario.password_hash = hash_password(new_password)
    usuario.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()

    return ChangePasswordResponse(mensaje="Contraseña actualizada exitosamente.")


async def get_preferencias(usuario: Usuario, db: AsyncSession) -> PreferenciasOut:
    """Get user preferences."""
    return await _get_preferencias_out(usuario, db)


async def update_preferencias(usuario: Usuario, data: PreferenciasUpdateRequest, db: AsyncSession) -> PreferenciasOut:
    """Update user preferences."""
    pref = await _get_or_create_preferencias(usuario.id, db)

    if data.idioma is not None:
        pref.idioma = data.idioma
    if data.tema_visual is not None:
        pref.tema_visual = data.tema_visual
    if data.zona_horaria is not None:
        pref.configuracion_regional = data.zona_horaria

    await db.flush()

    return PreferenciasOut(
        idioma=pref.idioma,
        tema_visual=pref.tema_visual,
        zona_horaria=pref.configuracion_regional,
    )
