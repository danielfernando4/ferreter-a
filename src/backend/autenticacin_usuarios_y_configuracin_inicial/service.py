from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
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
    SetupResponse,
    UserActionResponse,
    UserOut,
    ChangePasswordResponse,
    LogoutResponse,
    ResetPasswordResponse,
)
from .utils import (
    create_access_token,
    create_reset_token,
    hash_password,
    hash_token,
    verify_password,
)

ROLES_PREDEFINIDOS = {
    "administrador": "Acceso completo a todas las funcionalidades del sistema",
    "vendedor": "Acceso al punto de venta y consulta de clientes",
    "almacen": "Acceso a inventario, productos y órdenes de compra",
}


async def _get_user_out(db: AsyncSession, user: Usuario) -> UserOut:
    """Convert Usuario ORM to UserOut with rol name and ultimo_acceso."""
    await db.refresh(user, attribute_names=["rol"])
    ultimo_acceso = None
    if user.tokens_sesion:
        last_token = max(user.tokens_sesion, key=lambda t: t.fecha_creacion)
        ultimo_acceso = last_token.fecha_creacion

    return UserOut(
        id=user.id,
        nombre_completo=user.nombre_completo,
        email=user.email,
        rol=user.rol.nombre,
        activo=user.activo,
        fecha_registro=user.fecha_creacion,
        ultimo_acceso=ultimo_acceso,
    )


async def check_setup_status(db: AsyncSession) -> dict:
    """Check if setup has been completed and if admin exists."""
    result = await db.execute(
        select(ConfiguracionNegocio).where(ConfiguracionNegocio.setup_completado == True)
    )
    config = result.scalars().first()

    result2 = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .join(Rol)
        .where(Rol.nombre == "administrador", Usuario.activo == True)
    )
    admin = result2.scalars().first()

    return {
        "setup_completed": config is not None,
        "admin_exists": admin is not None,
    }


async def run_setup(db: AsyncSession, data: dict) -> SetupResponse:
    """Run the initial setup wizard."""
    # Check if setup already completed
    result = await db.execute(
        select(ConfiguracionNegocio).where(ConfiguracionNegocio.setup_completado == True)
    )
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="SETUP_ALREADY_COMPLETED",
        )

    # Create roles if they don't exist
    for role_name, desc in ROLES_PREDEFINIDOS.items():
        existing = await db.execute(select(Rol).where(Rol.nombre == role_name))
        if not existing.scalars().first():
            db.add(Rol(nombre=role_name, descripcion=desc))
    await db.commit()

    # Get admin role
    result = await db.execute(select(Rol).where(Rol.nombre == "administrador"))
    admin_rol = result.scalars().first()

    # Check if email already exists
    result = await db.execute(select(Usuario).where(Usuario.email == data["email"]))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="INVALID_DATA",
        )

    # Create admin user
    user = Usuario(
        nombre_completo=data["nombre_completo"],
        email=data["email"],
        password_hash=hash_password(data["password"]),
        activo=True,
        rol_id=admin_rol.id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user, attribute_names=["rol"])

    # Create preferences for admin
    prefs = PreferenciasUsuario(
        usuario_id=user.id,
        idioma="es",
        tema_visual="light",
        configuracion_regional="es-MX",
    )
    db.add(prefs)

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

    user_out = await _get_user_out(db, user)
    return SetupResponse(mensaje="Configuración inicial completada exitosamente", usuario=user_out)


async def authenticate_user(db: AsyncSession, email: str, password: str, remember: bool) -> dict:
    """Authenticate user and return token response."""
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.email == email, Usuario.activo == True)
    )
    user = result.scalars().first()

    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="INVALID_CREDENTIALS",
        )

    raw_token, hashed_token, expires_at = create_access_token(remember=remember)

    token_record = TokenSesion(
        usuario_id=user.id,
        token_hash=hashed_token,
        es_persistente=remember,
        fecha_expiracion=expires_at,
        activo=True,
    )
    db.add(token_record)
    await db.commit()

    expires_in = int((expires_at - datetime.now(timezone.utc)).total_seconds())
    user_out = await _get_user_out(db, user)

    return {
        "token": raw_token,
        "token_type": "bearer",
        "expires_in": max(expires_in, 0),
        "usuario": user_out,
    }


async def forgot_password(db: AsyncSession, email: str) -> dict:
    """Send password reset token (simulated - no actual email sending in MVP)."""
    result = await db.execute(select(Usuario).where(Usuario.email == email, Usuario.activo == True))
    user = result.scalars().first()

    if user is None:
        return {"mensaje": "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña"}

    raw_token, hashed_token, expires_at = create_reset_token()

    reset_record = TokenRestablecimiento(
        usuario_id=user.id,
        token_hash=hashed_token,
        fecha_expiracion=expires_at,
        utilizado=False,
    )
    db.add(reset_record)
    await db.commit()

    # In a real app, send email here
    print(f"[EMAIL SIMULATED] Reset link: {raw_token}")

    return {"mensaje": "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña"}


async def verify_reset_token(db: AsyncSession, token: str) -> dict:
    """Verify a reset token is valid."""
    token_hashed = hash_token(token)
    result = await db.execute(
        select(TokenRestablecimiento)
        .options(selectinload(TokenRestablecimiento.usuario))
        .where(TokenRestablecimiento.token_hash == token_hashed)
    )
    record = result.scalars().first()

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="TOKEN_NOT_FOUND",
        )

    if record.utilizado:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="TOKEN_EXPIRED",
        )

    if record.fecha_expiracion.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="TOKEN_EXPIRED",
        )

    return {"valido": True, "email": record.usuario.email}


async def reset_password(db: AsyncSession, token: str, new_password: str, confirm_password: str) -> ResetPasswordResponse:
    """Reset password using a valid token."""
    if new_password != confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PASSWORDS_DONT_MATCH",
        )

    token_hashed = hash_token(token)
    result = await db.execute(
        select(TokenRestablecimiento)
        .options(selectinload(TokenRestablecimiento.usuario))
        .where(TokenRestablecimiento.token_hash == token_hashed)
    )
    record = result.scalars().first()

    if record is None or record.utilizado:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="TOKEN_INVALID_OR_EXPIRED",
        )

    if record.fecha_expiracion.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="TOKEN_INVALID_OR_EXPIRED",
        )

    user = record.usuario
    user.password_hash = hash_password(new_password)
    record.utilizado = True
    await db.commit()

    return ResetPasswordResponse(mensaje="Contraseña restablecida exitosamente")


async def get_current_user_profile(db: AsyncSession, user: Usuario) -> PerfilResponse:
    """Get current user profile with preferences."""
    result = await db.execute(
        select(PreferenciasUsuario).where(PreferenciasUsuario.usuario_id == user.id)
    )
    prefs = result.scalars().first()

    if prefs is None:
        prefs = PreferenciasUsuario(usuario_id=user.id)
        db.add(prefs)
        await db.commit()
        await db.refresh(prefs)

    user_out = await _get_user_out(db, user)
    preferencias_out = PreferenciasOut(
        idioma=prefs.idioma,
        tema_visual=prefs.tema_visual,
        zona_horaria=prefs.configuracion_regional,
    )

    return PerfilResponse(usuario=user_out, preferencias=preferencias_out)


async def update_profile(db: AsyncSession, user: Usuario, data: dict) -> UserOut:
    """Update user profile (name, email)."""
    if "email" in data and data["email"] is not None and data["email"] != user.email:
        result = await db.execute(
            select(Usuario).where(Usuario.email == data["email"], Usuario.id != user.id)
        )
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="EMAIL_EXISTS",
            )
        user.email = data["email"]

    if "nombre_completo" in data and data["nombre_completo"] is not None:
        user.nombre_completo = data["nombre_completo"]

    await db.commit()
    await db.refresh(user, attribute_names=["rol"])
    return await _get_user_out(db, user)


async def change_password_service(
    db: AsyncSession, user: Usuario, current_password: str, new_password: str, confirm_password: str
) -> ChangePasswordResponse:
    """Change user password."""
    if not verify_password(current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="INVALID_CURRENT_PASSWORD",
        )

    if new_password != confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PASSWORDS_DONT_MATCH",
        )

    user.password_hash = hash_password(new_password)
    await db.commit()

    return ChangePasswordResponse(mensaje="Contraseña cambiada exitosamente")


async def logout_user(db: AsyncSession, token_raw: str) -> LogoutResponse:
    """Invalidate the current session token."""
    token_hashed = hash_token(token_raw)
    result = await db.execute(
        select(TokenSesion).where(TokenSesion.token_hash == token_hashed, TokenSesion.activo == True)
    )
    token_record = result.scalars().first()

    if token_record:
        token_record.activo = False
        await db.commit()

    return LogoutResponse(mensaje="Sesión cerrada exitosamente")


async def list_usuarios(
    db: AsyncSession,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
) -> dict:
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

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    offset = (page - 1) * page_size
    query = query.order_by(Usuario.fecha_creacion.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    users = result.scalars().all()

    items = []
    for u in users:
        items.append(await _get_user_out(db, u))

    total_pages = max(1, (total + page_size - 1) // page_size)

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


async def get_usuario(db: AsyncSession, user_id: int) -> UserOut:
    """Get a single user by ID."""
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.id == user_id)
    )
    user = result.scalars().first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND",
        )

    return await _get_user_out(db, user)


async def create_usuario(db: AsyncSession, data: dict) -> UserOut:
    """Create a new user (admin only)."""
    if data["rol"] not in ROLES_PREDEFINIDOS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="INVALID_DATA",
        )

    result = await db.execute(select(Usuario).where(Usuario.email == data["email"]))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="EMAIL_EXISTS",
        )

    result = await db.execute(select(Rol).where(Rol.nombre == data["rol"]))
    rol = result.scalars().first()
    if rol is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="INVALID_DATA",
        )

    user = Usuario(
        nombre_completo=data["nombre_completo"],
        email=data["email"],
        password_hash=hash_password(data["password"]),
        activo=True,
        rol_id=rol.id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user, attribute_names=["rol"])

    # Create default preferences
    prefs = PreferenciasUsuario(usuario_id=user.id)
    db.add(prefs)
    await db.commit()

    return await _get_user_out(db, user)


async def update_usuario(db: AsyncSession, user_id: int, data: dict) -> UserOut:
    """Update an existing user (admin only, cannot change password)."""
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.id == user_id)
    )
    user = result.scalars().first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND",
        )

    if "email" in data and data["email"] is not None and data["email"] != user.email:
        result = await db.execute(
            select(Usuario).where(Usuario.email == data["email"], Usuario.id != user_id)
        )
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="EMAIL_EXISTS",
            )
        user.email = data["email"]

    if "nombre_completo" in data and data["nombre_completo"] is not None:
        user.nombre_completo = data["nombre_completo"]

    if "rol" in data and data["rol"] is not None and data["rol"] != user.rol.nombre:
        if data["rol"] not in ROLES_PREDEFINIDOS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="INVALID_DATA",
            )
        result = await db.execute(select(Rol).where(Rol.nombre == data["rol"]))
        new_rol = result.scalars().first()
        if new_rol is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="INVALID_DATA",
            )
        user.rol_id = new_rol.id

    await db.commit()
    await db.refresh(user, attribute_names=["rol"])
    return await _get_user_out(db, user)


async def deactivate_usuario(db: AsyncSession, user_id: int, current_user: Usuario) -> UserActionResponse:
    """Deactivate a user (admin cannot deactivate themselves)."""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="CANNOT_DEACTIVATE_SELF",
        )

    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.id == user_id)
    )
    user = result.scalars().first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND",
        )

    user.activo = False

    # Invalidate all active tokens for this user
    await db.execute(
        TokenSesion.__table__.update()
        .where(TokenSesion.usuario_id == user_id, TokenSesion.activo == True)
        .values(activo=False)
    )

    await db.commit()
    user_out = await _get_user_out(db, user)

    return UserActionResponse(mensaje="Usuario desactivado exitosamente", usuario=user_out)


async def reactivate_usuario(db: AsyncSession, user_id: int) -> UserActionResponse:
    """Reactivate a deactivated user."""
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol))
        .where(Usuario.id == user_id)
    )
    user = result.scalars().first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NOT_FOUND",
        )

    user.activo = True
    await db.commit()
    user_out = await _get_user_out(db, user)

    return UserActionResponse(mensaje="Usuario reactivado exitosamente", usuario=user_out)


async def get_preferencias(db: AsyncSession, user: Usuario) -> PreferenciasOut:
    """Get user preferences."""
    result = await db.execute(
        select(PreferenciasUsuario).where(PreferenciasUsuario.usuario_id == user.id)
    )
    prefs = result.scalars().first()

    if prefs is None:
        prefs = PreferenciasUsuario(usuario_id=user.id)
        db.add(prefs)
        await db.commit()
        await db.refresh(prefs)

    return PreferenciasOut(
        idioma=prefs.idioma,
        tema_visual=prefs.tema_visual,
        zona_horaria=prefs.configuracion_regional,
    )


async def update_preferencias(db: AsyncSession, user: Usuario, data: dict) -> PreferenciasOut:
    """Update user preferences."""
    result = await db.execute(
        select(PreferenciasUsuario).where(PreferenciasUsuario.usuario_id == user.id)
    )
    prefs = result.scalars().first()

    if prefs is None:
        prefs = PreferenciasUsuario(usuario_id=user.id)
        db.add(prefs)
        await db.commit()
        await db.refresh(prefs)

    if "idioma" in data and data["idioma"] is not None:
        prefs.idioma = data["idioma"]
    if "tema_visual" in data and data["tema_visual"] is not None:
        prefs.tema_visual = data["tema_visual"]
    if "zona_horaria" in data and data["zona_horaria"] is not None:
        prefs.configuracion_regional = data["zona_horaria"]

    await db.commit()
    await db.refresh(prefs)

    return PreferenciasOut(
        idioma=prefs.idioma,
        tema_visual=prefs.tema_visual,
        zona_horaria=prefs.configuracion_regional,
    )
