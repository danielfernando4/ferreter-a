from datetime import datetime, timezone

from sqlalchemy import select, func, delete
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
    generate_session_token,
    get_reset_token_expiry,
    get_token_expiry,
    hash_password,
    hash_token,
    verify_password,
)


async def get_or_create_roles(db: AsyncSession) -> dict[str, Rol]:
    roles_map = {}
    role_names = ["administrador", "vendedor", "almacen"]
    descriptions = {
        "administrador": "Acceso completo al sistema. Gestión de usuarios, configuración y todos los módulos.",
        "vendedor": "Acceso al punto de venta, consulta de inventario y gestión de clientes.",
        "almacen": "Acceso a inventario, órdenes de compra y reportes de almacén.",
    }
    for name in role_names:
        result = await db.execute(select(Rol).where(Rol.nombre == name))
        rol = result.scalar_one_or_none()
        if rol is None:
            rol = Rol(nombre=name, descripcion=descriptions[name])
            db.add(rol)
            await db.flush()
        roles_map[name] = rol
    return roles_map


async def check_setup_status(db: AsyncSession):
    result = await db.execute(select(ConfiguracionNegocio).limit(1))
    config = result.scalar_one_or_none()
    setup_completed = config is not None and config.setup_completado

    result = await db.execute(
        select(Usuario).join(Rol).where(Rol.nombre == "administrador", Usuario.activo.is_(True)).limit(1)
    )
    admin = result.scalar_one_or_none()
    admin_exists = admin is not None

    return {
        "setup_completed": setup_completed,
        "admin_exists": admin_exists,
    }


async def run_setup(db: AsyncSession, data) -> dict:
    # Check if setup already completed
    result = await db.execute(select(ConfiguracionNegocio).limit(1))
    existing_config = result.scalar_one_or_none()
    if existing_config is not None and existing_config.setup_completado:
        raise ValueError("SETUP_ALREADY_COMPLETED")

    # Check if admin already exists
    result = await db.execute(
        select(Usuario).join(Rol).where(Rol.nombre == "administrador", Usuario.activo.is_(True)).limit(1)
    )
    existing_admin = result.scalar_one_or_none()
    if existing_admin is not None:
        raise ValueError("SETUP_ALREADY_COMPLETED")

    await get_or_create_roles(db)

    # Create admin user
    result = await db.execute(select(Rol).where(Rol.nombre == "administrador"))
    admin_rol = result.scalar_one()

    usuario = Usuario(
        nombre_completo=data.nombre_completo,
        email=data.email,
        password_hash=hash_password(data.password),
        activo=True,
        rol_id=admin_rol.id,
        fecha_creacion=datetime.now(timezone.utc),
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

    # Create business config
    config = ConfiguracionNegocio(
        nombre=data.negocio_nombre,
        direccion=data.negocio_direccion,
        datos_fiscales=data.negocio_rfc,
        telefono=data.negocio_telefono,
        email_contacto=data.email,
        setup_completado=True,
        fecha_creacion=datetime.now(timezone.utc),
    )
    db.add(config)
    await db.commit()
    await db.refresh(usuario)

    return {
        "mensaje": "Configuración inicial completada exitosamente",
        "usuario": usuario,
    }


async def authenticate_user(db: AsyncSession, email: str, password: str, remember: bool) -> dict:
    result = await db.execute(
        select(Usuario).where(Usuario.email == email, Usuario.activo.is_(True))
    )
    user = result.scalar_one_or_none()

    if user is None or not verify_password(password, user.password_hash):
        raise ValueError("INVALID_CREDENTIALS")

    # Update ultimo_acceso
    user.ultimo_acceso = datetime.now(timezone.utc)
    user.fecha_actualizacion = datetime.now(timezone.utc)

    # Generate session token
    token_str = generate_session_token()
    token_hashed = hash_token(token_str)
    expiry = get_token_expiry(remember)

    token_row = TokenSesion(
        usuario_id=user.id,
        token_hash=token_hashed,
        es_persistente=remember,
        fecha_expiracion=expiry,
        fecha_creacion=datetime.now(timezone.utc),
        activo=True,
    )
    db.add(token_row)
    await db.commit()
    await db.refresh(user)

    return {
        "token": token_str,
        "token_type": "bearer",
        "expires_in": int((expiry - datetime.now(timezone.utc)).total_seconds()),
        "usuario": user,
    }


async def logout_user(db: AsyncSession, token_str: str):
    token_hashed = hash_token(token_str)
    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.token_hash == token_hashed,
            TokenSesion.activo.is_(True),
        )
    )
    token_row = result.scalar_one_or_none()
    if token_row:
        token_row.activo = False
        await db.commit()


async def invalidate_all_user_sessions(db: AsyncSession, usuario_id: int):
    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.usuario_id == usuario_id,
            TokenSesion.activo.is_(True),
        )
    )
    tokens = result.scalars().all()
    for token in tokens:
        token.activo = False
    await db.commit()


async def list_usuarios(
    db: AsyncSession,
    search: str | None = None,
    page: int = 1,
    page_size: int = 10,
) -> dict:
    query = select(Usuario).join(Rol)

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            Usuario.nombre_completo.ilike(search_pattern)
            | Usuario.email.ilike(search_pattern)
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    query = query.order_by(Usuario.fecha_creacion.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    usuarios = result.scalars().all()

    total_pages = max(1, (total + page_size - 1) // page_size)

    return {
        "items": usuarios,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


async def get_usuario_by_id(db: AsyncSession, usuario_id: int) -> Usuario | None:
    result = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    return result.scalar_one_or_none()


async def create_usuario(db: AsyncSession, data) -> Usuario:
    # Check email uniqueness
    result = await db.execute(select(Usuario).where(Usuario.email == data.email))
    existing = result.scalar_one_or_none()
    if existing is not None:
        raise ValueError("EMAIL_EXISTS")

    await get_or_create_roles(db)

    result = await db.execute(select(Rol).where(Rol.nombre == data.rol))
    rol = result.scalar_one()

    usuario = Usuario(
        nombre_completo=data.nombre_completo,
        email=data.email,
        password_hash=hash_password(data.password),
        activo=True,
        rol_id=rol.id,
        fecha_creacion=datetime.now(timezone.utc),
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


async def update_usuario(db: AsyncSession, usuario_id: int, data) -> Usuario:
    result = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    usuario = result.scalar_one_or_none()
    if usuario is None:
        raise ValueError("NOT_FOUND")

    if data.email is not None and data.email != usuario.email:
        result = await db.execute(
            select(Usuario).where(Usuario.email == data.email, Usuario.id != usuario_id)
        )
        existing = result.scalar_one_or_none()
        if existing is not None:
            raise ValueError("EMAIL_EXISTS")
        usuario.email = data.email

    if data.nombre_completo is not None:
        usuario.nombre_completo = data.nombre_completo

    if data.rol is not None:
        result = await db.execute(select(Rol).where(Rol.nombre == data.rol))
        rol = result.scalar_one()
        usuario.rol_id = rol.id

    usuario.fecha_actualizacion = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(usuario)
    return usuario


async def deactivate_usuario(db: AsyncSession, usuario_id: int, current_user_id: int) -> Usuario:
    if usuario_id == current_user_id:
        raise ValueError("CANNOT_DEACTIVATE_SELF")

    result = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    usuario = result.scalar_one_or_none()
    if usuario is None:
        raise ValueError("NOT_FOUND")

    usuario.activo = False
    usuario.fecha_actualizacion = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(usuario)

    # Invalidate all sessions
    await invalidate_all_user_sessions(db, usuario_id)

    return usuario


async def reactivate_usuario(db: AsyncSession, usuario_id: int) -> Usuario:
    result = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    usuario = result.scalar_one_or_none()
    if usuario is None:
        raise ValueError("NOT_FOUND")

    usuario.activo = True
    usuario.fecha_actualizacion = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(usuario)
    return usuario


async def forgot_password(db: AsyncSession, email: str):
    result = await db.execute(select(Usuario).where(Usuario.email == email, Usuario.activo.is_(True)))
    user = result.scalar_one_or_none()

    # Always return success to not reveal account existence
    if user is None:
        return {"mensaje": "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña."}

    # Invalidate previous reset tokens
    await db.execute(
        delete(TokenRestablecimiento).where(
            TokenRestablecimiento.usuario_id == user.id,
            TokenRestablecimiento.utilizado.is_(False),
        )
    )

    token_str = generate_session_token()
    token_hashed = hash_token(token_str)

    reset_token = TokenRestablecimiento(
        usuario_id=user.id,
        token_hash=token_hashed,
        fecha_expiracion=get_reset_token_expiry(),
        utilizado=False,
        fecha_creacion=datetime.now(timezone.utc),
    )
    db.add(reset_token)
    await db.commit()

    # In a real app, send email here
    # For MVP, we return the token in the response for testing
    return {
        "mensaje": "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.",
        "_debug_token": token_str,
    }


async def verify_reset_token(db: AsyncSession, token: str) -> dict:
    token_hashed = hash_token(token)
    result = await db.execute(
        select(TokenRestablecimiento).where(
            TokenRestablecimiento.token_hash == token_hashed,
            TokenRestablecimiento.utilizado.is_(False),
        )
    )
    reset_token = result.scalar_one_or_none()

    if reset_token is None:
        raise ValueError("TOKEN_NOT_FOUND")

    if reset_token.fecha_expiracion < datetime.now(timezone.utc):
        raise ValueError("TOKEN_EXPIRED")

    user_result = await db.execute(
        select(Usuario).where(Usuario.id == reset_token.usuario_id)
    )
    user = user_result.scalar_one()

    return {"valido": True, "email": user.email}


async def reset_password(db: AsyncSession, token: str, new_password: str, confirm_password: str):
    if new_password != confirm_password:
        raise ValueError("PASSWORDS_DONT_MATCH")

    token_hashed = hash_token(token)
    result = await db.execute(
        select(TokenRestablecimiento).where(
            TokenRestablecimiento.token_hash == token_hashed,
            TokenRestablecimiento.utilizado.is_(False),
        )
    )
    reset_token = result.scalar_one_or_none()

    if reset_token is None or reset_token.fecha_expiracion < datetime.now(timezone.utc):
        raise ValueError("TOKEN_INVALID_OR_EXPIRED")

    user_result = await db.execute(
        select(Usuario).where(Usuario.id == reset_token.usuario_id)
    )
    user = user_result.scalar_one()

    user.password_hash = hash_password(new_password)
    user.fecha_actualizacion = datetime.now(timezone.utc)
    reset_token.utilizado = True

    # Invalidate all sessions
    await invalidate_all_user_sessions(db, user.id)

    await db.commit()
    return {"mensaje": "Contraseña restablecida exitosamente."}


async def change_password(
    db: AsyncSession,
    user: Usuario,
    current_password: str,
    new_password: str,
    confirm_password: str,
):
    if not verify_password(current_password, user.password_hash):
        raise ValueError("INVALID_CURRENT_PASSWORD")

    if new_password != confirm_password:
        raise ValueError("PASSWORDS_DONT_MATCH")

    user.password_hash = hash_password(new_password)
    user.fecha_actualizacion = datetime.now(timezone.utc)
    await db.commit()

    # Invalidate all sessions except current one
    await invalidate_all_user_sessions(db, user.id)

    return {"mensaje": "Contraseña cambiada exitosamente."}


async def get_user_preferences(db: AsyncSession, user: Usuario) -> PreferenciasUsuario:
    # Ensure preferences exist
    if user.preferencias is None:
        pref = PreferenciasUsuario(
            usuario_id=user.id,
            idioma="es",
            tema_visual="light",
            zona_horaria="America/Mexico_City",
        )
        db.add(pref)
        await db.commit()
        await db.refresh(user)
    return user.preferencias


async def update_user_preferences(db: AsyncSession, user: Usuario, data) -> PreferenciasUsuario:
    prefs = await get_user_preferences(db, user)

    if data.idioma is not None:
        prefs.idioma = data.idioma
    if data.tema_visual is not None:
        prefs.tema_visual = data.tema_visual
    if data.zona_horaria is not None:
        prefs.zona_horaria = data.zona_horaria

    await db.commit()
    await db.refresh(prefs)
    return prefs
