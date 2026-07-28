from datetime import datetime, timezone

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from .models import (
    ConfiguracionNegocio,
    PreferenciasUsuario,
    Rol,
    TokenRestablecimiento,
    TokenSesion,
    Usuario,
)
from .utils import (
    generate_token,
    get_reset_token_expiration,
    get_token_expiration,
    hash_password,
    hash_token,
    verify_password,
)

ROLES_PREDEFINIDOS = {
    "administrador": "Acceso total al sistema. Gestión de usuarios, configuración y reportes.",
    "vendedor": "Acceso al punto de venta y consulta de inventario. No puede administrar usuarios.",
    "almacen": "Acceso a inventario y órdenes de compra. No puede acceder al punto de venta.",
}


# ─── Setup ─────────────────────────────────────────────
async def check_setup_status(db: AsyncSession) -> dict:
    """Check if setup has been completed and if any admin exists."""
    result = await db.execute(select(ConfiguracionNegocio).limit(1))
    config = result.scalar_one_or_none()

    result = await db.execute(select(Usuario).where(Usuario.rol_id == 1).limit(1))
    admin = result.scalar_one_or_none()

    setup_completed = config.setup_completado if config else False
    admin_exists = admin is not None
    return {"setup_completed": setup_completed, "admin_exists": admin_exists}


async def run_setup(db: AsyncSession, data: dict) -> Usuario:
    """Execute the initial setup: create roles, admin user, and business config."""
    # Check if already completed
    result = await db.execute(select(ConfiguracionNegocio).limit(1))
    config = result.scalar_one_or_none()
    if config and config.setup_completado:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La configuración inicial ya fue completada.",
        )

    # Check admin exists
    result = await db.execute(select(Usuario).where(Usuario.rol_id == 1).limit(1))
    existing_admin = result.scalar_one_or_none()
    if existing_admin:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un administrador registrado.",
        )

    # Create roles
    existing_roles = await db.execute(select(Rol))
    if existing_roles.scalars().first() is None:
        for nombre, descripcion in ROLES_PREDEFINIDOS.items():
            db.add(Rol(nombre=nombre, descripcion=descripcion))
        await db.flush()

    # Get admin role
    result = await db.execute(select(Rol).where(Rol.nombre == "administrador"))
    admin_rol = result.scalar_one()

    # Create admin user
    usuario = Usuario(
        nombre_completo=data["nombre_completo"],
        email=data["email"].strip().lower(),
        password_hash=hash_password(data["password"]),
        rol_id=admin_rol.id,
        activo=True,
        fecha_registro=datetime.now(timezone.utc),
    )
    db.add(usuario)
    await db.flush()

    # Create preferences for admin
    preferencias = PreferenciasUsuario(
        usuario_id=usuario.id,
        idioma="es",
        tema_visual="light",
        configuracion_regional="es-MX",
    )
    db.add(preferencias)

    # Create or update business config
    if config is None:
        config = ConfiguracionNegocio(
            nombre=data["negocio_nombre"],
            direccion=data["negocio_direccion"],
            datos_fiscales=data["negocio_rfc"],
            telefono=data.get("negocio_telefono"),
            setup_completado=True,
        )
        db.add(config)
    else:
        config.nombre = data["negocio_nombre"]
        config.direccion = data["negocio_direccion"]
        config.datos_fiscales = data["negocio_rfc"]
        config.telefono = data.get("negocio_telefono")
        config.setup_completado = True

    await db.commit()
    await db.refresh(usuario)
    return usuario


# ─── Autenticación ─────────────────────────────────────
async def authenticate_user(db: AsyncSession, email: str, password: str) -> Usuario | None:
    """Validate credentials and return user or None."""
    result = await db.execute(
        select(Usuario).where(
            Usuario.email == email.strip().lower(),
            Usuario.activo == True,
        )
    )
    user = result.scalar_one_or_none()

    if user is None:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user


async def create_session_token(db: AsyncSession, user_id: int, persistent: bool = False) -> str:
    """Create a new session token for the user. Returns the raw token string."""
    token = generate_token()
    token_hashed = hash_token(token)
    expiration = get_token_expiration(persistent)

    expires_in_seconds = int((expiration - datetime.now(timezone.utc)).total_seconds())

    session = TokenSesion(
        usuario_id=user_id,
        token_hash=token_hashed,
        es_persistente=persistent,
        fecha_expiracion=expiration,
        activo=True,
    )
    db.add(session)
    await db.flush()

    # Update ultimo_acceso
    await db.execute(
        update(Usuario).where(Usuario.id == user_id).values(ultimo_acceso=datetime.now(timezone.utc))
    )

    return token, expires_in_seconds


async def invalidate_token(db: AsyncSession, token_str: str) -> None:
    """Invalidate a specific session token."""
    token_hashed = hash_token(token_str)
    await db.execute(
        update(TokenSesion)
        .where(TokenSesion.token_hash == token_hashed)
        .values(activo=False)
    )
    await db.commit()


async def invalidar_tokens_usuario(db: AsyncSession, usuario_id: int) -> None:
    """Invalidate all active session tokens for a user."""
    await db.execute(
        update(TokenSesion)
        .where(
            TokenSesion.usuario_id == usuario_id,
            TokenSesion.activo == True,
        )
        .values(activo=False)
    )
    await db.commit()


# ─── Recuperación de contraseña ────────────────────────
async def create_reset_token(db: AsyncSession, email: str) -> str | None:
    """Create a password reset token. Returns raw token or None if email not found."""
    result = await db.execute(
        select(Usuario).where(Usuario.email == email.strip().lower(), Usuario.activo == True)
    )
    user = result.scalar_one_or_none()
    if user is None:
        return None

    token = generate_token()
    token_hashed = hash_token(token)
    expiration = get_reset_token_expiration()

    reset_token = TokenRestablecimiento(
        usuario_id=user.id,
        token_hash=token_hashed,
        fecha_expiracion=expiration,
        utilizado=False,
    )
    db.add(reset_token)
    await db.commit()

    return token


async def verify_reset_token(db: AsyncSession, raw_token: str) -> dict | None:
    """Verify a reset token. Returns dict with email and token_id, or None."""
    token_hashed = hash_token(raw_token)
    result = await db.execute(
        select(TokenRestablecimiento).where(
            TokenRestablecimiento.token_hash == token_hashed,
            TokenRestablecimiento.utilizado == False,
            TokenRestablecimiento.fecha_expiracion > datetime.now(timezone.utc),
        )
    )
    record = result.scalar_one_or_none()
    if record is None:
        return None

    user_result = await db.execute(select(Usuario).where(Usuario.id == record.usuario_id))
    user = user_result.scalar_one()

    return {"email": user.email, "token_id": record.id}


async def reset_password(db: AsyncSession, raw_token: str, new_password: str) -> bool:
    """Reset password using a valid reset token. Returns True on success."""
    token_hashed = hash_token(raw_token)
    result = await db.execute(
        select(TokenRestablecimiento).where(
            TokenRestablecimiento.token_hash == token_hashed,
            TokenRestablecimiento.utilizado == False,
            TokenRestablecimiento.fecha_expiracion > datetime.now(timezone.utc),
        )
    )
    record = result.scalar_one_or_none()
    if record is None:
        return False

    # Mark token as used
    record.utilizado = True

    # Update password
    password_hash = hash_password(new_password)
    await db.execute(
        update(Usuario)
        .where(Usuario.id == record.usuario_id)
        .values(password_hash=password_hash)
    )

    # Invalidate all sessions for this user
    await invalidar_tokens_usuario(db, record.usuario_id)

    await db.commit()
    return True


# ─── Usuarios CRUD ─────────────────────────────────────
async def list_usuarios(
    db: AsyncSession, search: str | None = None, page: int = 1, page_size: int = 10
) -> dict:
    """List users with pagination and optional search."""
    query = select(Usuario)

    if search:
        search_term = f"%{search}%"
        query = query.where(
            Usuario.nombre_completo.ilike(search_term) | Usuario.email.ilike(search_term)
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    query = query.order_by(Usuario.id.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    users = result.scalars().all()

    total_pages = max(1, (total + page_size - 1) // page_size)

    return {
        "items": users,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


async def get_usuario_by_id(db: AsyncSession, usuario_id: int) -> Usuario | None:
    """Get a single user by ID."""
    result = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    return result.scalar_one_or_none()


async def get_usuario_by_email(db: AsyncSession, email: str) -> Usuario | None:
    """Get a single user by email."""
    result = await db.execute(
        select(Usuario).where(Usuario.email == email.strip().lower())
    )
    return result.scalar_one_or_none()


async def create_usuario(db: AsyncSession, data: dict) -> Usuario:
    """Create a new user."""
    # Get role
    result = await db.execute(select(Rol).where(Rol.nombre == data["rol"]))
    rol = result.scalar_one_or_none()
    if rol is None:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rol '{data['rol']}' no válido. Roles disponibles: {list(ROLES_PREDEFINIDOS.keys())}",
        )

    user = Usuario(
        nombre_completo=data["nombre_completo"],
        email=data["email"].strip().lower(),
        password_hash=hash_password(data["password"]),
        rol_id=rol.id,
        activo=True,
        fecha_registro=datetime.now(timezone.utc),
    )
    db.add(user)
    await db.flush()

    # Create default preferences
    preferencias = PreferenciasUsuario(
        usuario_id=user.id,
        idioma="es",
        tema_visual="light",
        configuracion_regional="es-MX",
    )
    db.add(preferencias)
    await db.commit()
    await db.refresh(user)
    return user


async def update_usuario(db: AsyncSession, usuario_id: int, data: dict) -> Usuario | None:
    """Update user data. Returns updated user or None if not found."""
    user = await get_usuario_by_id(db, usuario_id)
    if user is None:
        return None

    if "nombre_completo" in data and data["nombre_completo"] is not None:
        user.nombre_completo = data["nombre_completo"]
    if "email" in data and data["email"] is not None:
        user.email = data["email"].strip().lower()
    if "rol" in data and data["rol"] is not None:
        result = await db.execute(select(Rol).where(Rol.nombre == data["rol"]))
        rol = result.scalar_one_or_none()
        if rol is None:
            from fastapi import HTTPException, status

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Rol '{data['rol']}' no válido.",
            )
        user.rol_id = rol.id

        # Invalidate all sessions when role changes
        await invalidar_tokens_usuario(db, usuario_id)

    await db.commit()
    await db.refresh(user)
    return user


async def deactivate_usuario(db: AsyncSession, usuario_id: int) -> Usuario | None:
    """Deactivate a user. Returns updated user or None if not found."""
    user = await get_usuario_by_id(db, usuario_id)
    if user is None:
        return None

    user.activo = False

    # Invalidate all sessions
    await invalidar_tokens_usuario(db, usuario_id)

    await db.commit()
    await db.refresh(user)
    return user


async def reactivate_usuario(db: AsyncSession, usuario_id: int) -> Usuario | None:
    """Reactivate a user. Returns updated user or None if not found."""
    user = await get_usuario_by_id(db, usuario_id)
    if user is None:
        return None

    user.activo = True
    await db.commit()
    await db.refresh(user)
    return user


# ─── Perfil y Preferencias ─────────────────────────────
async def update_perfil(db: AsyncSession, usuario_id: int, data: dict) -> Usuario | None:
    """Update user profile (name and email only)."""
    user = await get_usuario_by_id(db, usuario_id)
    if user is None:
        return None

    if "nombre_completo" in data and data["nombre_completo"] is not None:
        user.nombre_completo = data["nombre_completo"]
    if "email" in data and data["email"] is not None:
        user.email = data["email"].strip().lower()

    await db.commit()
    await db.refresh(user)
    return user


async def change_password(
    db: AsyncSession, usuario_id: int, current_password: str, new_password: str
) -> bool:
    """Change user password. Returns True on success."""
    user = await get_usuario_by_id(db, usuario_id)
    if user is None:
        return False

    if not verify_password(current_password, user.password_hash):
        return False

    user.password_hash = hash_password(new_password)

    # Invalidate all sessions
    await invalidar_tokens_usuario(db, usuario_id)

    await db.commit()
    return True


async def get_preferencias(db: AsyncSession, usuario_id: int) -> PreferenciasUsuario | None:
    """Get user preferences."""
    result = await db.execute(
        select(PreferenciasUsuario).where(PreferenciasUsuario.usuario_id == usuario_id)
    )
    return result.scalar_one_or_none()


async def update_preferencias(db: AsyncSession, usuario_id: int, data: dict) -> PreferenciasUsuario | None:
    """Update user preferences."""
    pref = await get_preferencias(db, usuario_id)
    if pref is None:
        # Create preferences if they don't exist
        pref = PreferenciasUsuario(usuario_id=usuario_id)
        db.add(pref)

    if "idioma" in data and data["idioma"] is not None:
        pref.idioma = data["idioma"]
    if "tema_visual" in data and data["tema_visual"] is not None:
        pref.tema_visual = data["tema_visual"]
    if "zona_horaria" in data and data["zona_horaria"] is not None:
        pref.configuracion_regional = data["zona_horaria"]

    await db.commit()
    await db.refresh(pref)
    return pref
