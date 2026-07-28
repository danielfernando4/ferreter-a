"""Business logic for Autenticación, Usuarios y Configuración Inicial."""

from datetime import datetime, timedelta, timezone
from typing import Optional, List, Tuple

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .models import (
    Usuario,
    Rol,
    ConfiguracionNegocio,
    PreferenciasUsuario,
    TokenSesion,
    TokenRestablecimiento,
)
from .schemas import (
    UserOut,
    SetupRequest,
    UserCreateRequest,
    UserUpdateRequest,
    PreferenciasOut,
    PerfilResponse,
    PaginatedUsersResponse,
)
from .utils import hash_password, verify_password, generate_token, hash_token
from config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REMEMBER_TOKEN_EXPIRE_DAYS,
    RESET_TOKEN_EXPIRE_HOURS,
)


# ─── Helpers ──────────────────────────────────────────────────────────────────

async def _get_user_out(db: AsyncSession, user: Usuario) -> UserOut:
    """Convert a Usuario ORM object to UserOut schema, ensuring all relationships are loaded."""
    # Ensure rol is loaded
    if not user.rol:
        result = await db.execute(
            select(Rol).where(Rol.id == user.rol_id)
        )
        user.rol = result.scalar_one_or_none()

    return UserOut.model_validate(user)


async def _fetch_user_with_relations(db: AsyncSession, user_id: int) -> Optional[Usuario]:
    """Fetch a user by ID with all relationships eager-loaded."""
    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.preferencias),
            selectinload(Usuario.tokens_sesion),
        )
        .where(Usuario.id == user_id)
    )
    return result.scalar_one_or_none()


async def _fetch_user_by_email_with_relations(db: AsyncSession, email: str) -> Optional[Usuario]:
    """Fetch a user by email with all relationships eager-loaded."""
    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.rol),
            selectinload(Usuario.preferencias),
            selectinload(Usuario.tokens_sesion),
        )
        .where(Usuario.email == email)
    )
    return result.scalar_one_or_none()


# ─── Setup ────────────────────────────────────────────────────────────────────

async def check_setup_status(db: AsyncSession) -> dict:
    """Check if setup has been completed and if an admin exists."""
    # Check if admin exists
    admin_role = await db.execute(select(Rol).where(Rol.nombre == "administrador"))
    admin_role = admin_role.scalar_one_or_none()

    admin_exists = False
    if admin_role:
        result = await db.execute(
            select(func.count(Usuario.id)).where(
                Usuario.rol_id == admin_role.id,
                Usuario.activo == True,
            )
        )
        admin_count = result.scalar()
        admin_exists = admin_count > 0

    # Check if setup is completed
    setup_result = await db.execute(
        select(ConfiguracionNegocio).where(ConfiguracionNegocio.setup_completado == True)
    )
    setup_completed = setup_result.scalar_one_or_none() is not None

    return {"setup_completed": setup_completed, "admin_exists": admin_exists}


async def run_setup(db: AsyncSession, data: SetupRequest) -> Tuple[str, Usuario]:
    """Execute the initial setup wizard: create admin user, config, defaults."""
    # Check if setup already completed
    status = await check_setup_status(db)
    if status["setup_completed"]:
        raise ValueError("SETUP_ALREADY_COMPLETED")

    # Check if email already exists
    existing = await db.execute(select(Usuario).where(Usuario.email == data.email))
    if existing.scalar_one_or_none():
        raise ValueError("INVALID_DATA")

    # Create or get admin rol
    admin_rol = await db.execute(select(Rol).where(Rol.nombre == "administrador"))
    admin_rol = admin_rol.scalar_one_or_none()
    if not admin_rol:
        # Create default roles
        roles_data = [
            ("administrador", "Acceso completo al sistema"),
            ("vendedor", "Vendedor / Cajero - acceso a POS y clientes"),
            ("almacen", "Almacén / Comprador - acceso a inventario y compras"),
        ]
        for nombre, desc in roles_data:
            rol = Rol(nombre=nombre, descripcion=desc)
            db.add(rol)
        await db.flush()
        admin_rol = await db.execute(select(Rol).where(Rol.nombre == "administrador"))
        admin_rol = admin_rol.scalar_one()

    # Create admin user
    password_hash = hash_password(data.password)
    user = Usuario(
        nombre_completo=data.nombre_completo,
        email=data.email,
        password_hash=password_hash,
        activo=True,
        rol_id=admin_rol.id,
        ultimo_acceso=datetime.now(timezone.utc),
    )
    db.add(user)
    await db.flush()

    # Create default preferences for the admin user
    prefs = PreferenciasUsuario(
        usuario_id=user.id,
        idioma="es",
        tema_visual="light",
        configuracion_regional="es-MX",
    )
    db.add(prefs)
    await db.flush()

    # Create business configuration
    config = ConfiguracionNegocio(
        nombre=data.negocio_nombre,
        direccion=data.negocio_direccion,
        datos_fiscales=data.negocio_rfc,
        rfc=data.negocio_rfc,
        telefono=data.negocio_telefono,
        email_contacto=data.email,
        setup_completado=True,
    )
    db.add(config)
    await db.flush()

    # Refresh user to load relationships
    await db.refresh(user, ["rol", "preferencias"])

    return "Configuración inicial completada exitosamente", user


# ─── Autenticación ────────────────────────────────────────────────────────────

async def login_user(
    db: AsyncSession,
    email: str,
    password: str,
    remember: bool = False,
) -> dict:
    """Authenticate a user and generate a session token."""
    # Find user by email
    user = await _fetch_user_by_email_with_relations(db, email)

    if user is None or not verify_password(password, user.password_hash):
        raise ValueError("INVALID_CREDENTIALS")

    if not user.activo:
        raise ValueError("INVALID_CREDENTIALS")

    # Update last access
    user.ultimo_acceso = datetime.now(timezone.utc)

    # Calculate expiration
    if remember:
        expires_in_seconds = REMEMBER_TOKEN_EXPIRE_DAYS * 24 * 3600
        expiration = datetime.now(timezone.utc) + timedelta(days=REMEMBER_TOKEN_EXPIRE_DAYS)
    else:
        expires_in_seconds = ACCESS_TOKEN_EXPIRE_MINUTES * 60
        expiration = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    # Generate and store token
    raw_token = generate_token()
    token_hash_val = hash_token(raw_token)

    token_record = TokenSesion(
        usuario_id=user.id,
        token_hash=token_hash_val,
        es_persistente=remember,
        fecha_expiracion=expiration,
        activo=True,
    )
    db.add(token_record)
    await db.flush()

    user_out = await _get_user_out(db, user)

    return {
        "token": raw_token,
        "token_type": "bearer",
        "expires_in": expires_in_seconds,
        "usuario": user_out,
    }


async def logout_user(db: AsyncSession, user: Usuario, raw_token: str) -> None:
    """Invalidate the current session token."""
    token_hash_val = hash_token(raw_token)
    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.token_hash == token_hash_val,
            TokenSesion.usuario_id == user.id,
            TokenSesion.activo == True,
        )
    )
    token_record = result.scalar_one_or_none()
    if token_record:
        token_record.activo = False
        await db.flush()


async def invalidate_all_user_tokens(db: AsyncSession, user_id: int) -> None:
    """Invalidate all active tokens for a user."""
    result = await db.execute(
        select(TokenSesion).where(
            TokenSesion.usuario_id == user_id,
            TokenSesion.activo == True,
        )
    )
    tokens = result.scalars().all()
    for token in tokens:
        token.activo = False
    if tokens:
        await db.flush()


# ─── Recuperación de Contraseña ───────────────────────────────────────────────

async def forgot_password(db: AsyncSession, email: str) -> None:
    """Generate and store a password reset token. Always returns success to avoid email enumeration."""
    user = await _fetch_user_by_email_with_relations(db, email)
    if user is None:
        return  # Silent success to avoid email enumeration

    # Invalidate any existing unused reset tokens for this user
    result = await db.execute(
        select(TokenRestablecimiento).where(
            TokenRestablecimiento.usuario_id == user.id,
            TokenRestablecimiento.utilizado == False,
            TokenRestablecimiento.fecha_expiracion > datetime.now(timezone.utc),
        )
    )
    old_tokens = result.scalars().all()
    for t in old_tokens:
        t.utilizado = True

    # Generate new reset token
    raw_token = generate_token()
    token_hash_val = hash_token(raw_token)
    expiration = datetime.now(timezone.utc) + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS)

    reset_token = TokenRestablecimiento(
        usuario_id=user.id,
        token_hash=token_hash_val,
        fecha_expiracion=expiration,
        utilizado=False,
    )
    db.add(reset_token)
    await db.flush()

    # Note: In a real system, we'd send an email here with the raw_token
    # For MVP, the raw_token is returned implicitly — the frontend can simulate
    # by storing it temporarily. In production, send an email.


async def verify_reset_token(db: AsyncSession, token: str) -> dict:
    """Verify a password reset token and return the associated email."""
    token_hash_val = hash_token(token)
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(TokenRestablecimiento)
        .options(selectinload(TokenRestablecimiento.usuario))
        .where(
            TokenRestablecimiento.token_hash == token_hash_val,
            TokenRestablecimiento.utilizado == False,
        )
    )
    reset_token = result.scalar_one_or_none()

    if reset_token is None:
        raise ValueError("TOKEN_NOT_FOUND")

    if reset_token.fecha_expiracion < now:
        raise ValueError("TOKEN_EXPIRED")

    return {"valido": True, "email": reset_token.usuario.email}


async def reset_password(db: AsyncSession, token: str, new_password: str, confirm_password: str) -> str:
    """Reset a user's password using a valid reset token."""
    if new_password != confirm_password:
        raise ValueError("PASSWORDS_DONT_MATCH")

    token_hash_val = hash_token(token)
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(TokenRestablecimiento)
        .options(selectinload(TokenRestablecimiento.usuario))
        .where(
            TokenRestablecimiento.token_hash == token_hash_val,
            TokenRestablecimiento.utilizado == False,
        )
    )
    reset_token = result.scalar_one_or_none()

    if reset_token is None or reset_token.fecha_expiracion < now:
        raise ValueError("TOKEN_INVALID_OR_EXPIRED")

    # Update password
    user = reset_token.usuario
    user.password_hash = hash_password(new_password)

    # Invalidate token
    reset_token.utilizado = True

    # Invalidate all active sessions for this user
    await invalidate_all_user_tokens(db, user.id)

    await db.flush()

    return "Contraseña restablecida exitosamente"


# ─── Gestión de Usuarios ──────────────────────────────────────────────────────

async def list_usuarios(
    db: AsyncSession,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
) -> PaginatedUsersResponse:
    """List users with optional search and pagination."""
    query = select(Usuario).options(
        selectinload(Usuario.rol),
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
    total = total_result.scalar()

    # Paginate
    offset = (page - 1) * page_size
    query = query.order_by(Usuario.id.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    users = result.scalars().all()

    items = []
    for user in users:
        items.append(await _get_user_out(db, user))

    total_pages = max(1, (total + page_size - 1) // page_size)

    return PaginatedUsersResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


async def get_usuario(db: AsyncSession, user_id: int) -> Usuario:
    """Get a single user by ID."""
    user = await _fetch_user_with_relations(db, user_id)
    if user is None:
        raise ValueError("NOT_FOUND")
    return user


async def create_usuario(db: AsyncSession, data: UserCreateRequest) -> Usuario:
    """Create a new user."""
    # Check if email already exists
    existing = await db.execute(select(Usuario).where(Usuario.email == data.email))
    if existing.scalar_one_or_none():
        raise ValueError("EMAIL_EXISTS")

    # Find rol
    rol = await db.execute(select(Rol).where(Rol.nombre == data.rol))
    rol = rol.scalar_one_or_none()
    if rol is None:
        raise ValueError("INVALID_DATA")

    # Create user
    password_hash_val = hash_password(data.password)
    user = Usuario(
        nombre_completo=data.nombre_completo,
        email=data.email,
        password_hash=password_hash_val,
        activo=True,
        rol_id=rol.id,
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
    await db.refresh(user, ["rol", "preferencias"])

    return user


async def update_usuario(db: AsyncSession, user_id: int, data: UserUpdateRequest) -> Usuario:
    """Update an existing user."""
    user = await _fetch_user_with_relations(db, user_id)
    if user is None:
        raise ValueError("NOT_FOUND")

    # Check email uniqueness if changing
    if data.email is not None and data.email != user.email:
        existing = await db.execute(select(Usuario).where(Usuario.email == data.email))
        if existing.scalar_one_or_none():
            raise ValueError("EMAIL_EXISTS")
        user.email = data.email

    if data.nombre_completo is not None:
        user.nombre_completo = data.nombre_completo

    if data.rol is not None:
        rol = await db.execute(select(Rol).where(Rol.nombre == data.rol))
        rol = rol.scalar_one_or_none()
        if rol is None:
            raise ValueError("INVALID_DATA")
        user.rol_id = rol.id

    user.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(user, ["rol", "preferencias"])

    return user


async def deactivate_usuario(db: AsyncSession, user_id: int, current_user_id: int) -> Usuario:
    """Deactivate a user. Cannot deactivate self."""
    if user_id == current_user_id:
        raise ValueError("CANNOT_DEACTIVATE_SELF")

    user = await _fetch_user_with_relations(db, user_id)
    if user is None:
        raise ValueError("NOT_FOUND")

    user.activo = False
    user.fecha_actualizacion = datetime.now(timezone.utc)

    # Invalidate all active tokens
    await invalidate_all_user_tokens(db, user_id)

    await db.flush()
    await db.refresh(user, ["rol", "preferencias"])

    return user


async def reactivate_usuario(db: AsyncSession, user_id: int) -> Usuario:
    """Reactivate a deactivated user."""
    user = await _fetch_user_with_relations(db, user_id)
    if user is None:
        raise ValueError("NOT_FOUND")

    user.activo = True
    user.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(user, ["rol", "preferencias"])

    return user


# ─── Perfil y Preferencias ────────────────────────────────────────────────────

async def get_perfil(db: AsyncSession, user: Usuario) -> PerfilResponse:
    """Get the profile and preferences of the current user."""
    # Ensure user relationships are loaded
    if not user.rol:
        user = await _fetch_user_with_relations(db, user.id)

    user_out = await _get_user_out(db, user)

    # Get or create preferences
    if not user.preferencias:
        prefs = PreferenciasUsuario(
            usuario_id=user.id,
            idioma="es",
            tema_visual="light",
            configuracion_regional="es-MX",
        )
        db.add(prefs)
        await db.flush()
        await db.refresh(user, ["preferencias"])

    preferencias_out = PreferenciasOut(
        idioma=user.preferencias.idioma,
        tema_visual=user.preferencias.tema_visual,
        zona_horaria=user.preferencias.configuracion_regional,
    )

    return PerfilResponse(usuario=user_out, preferencias=preferencias_out)


async def update_perfil(db: AsyncSession, user: Usuario, nombre_completo: Optional[str], email: Optional[str]) -> Usuario:
    """Update the current user's profile."""
    if email is not None and email != user.email:
        existing = await db.execute(select(Usuario).where(Usuario.email == email))
        if existing.scalar_one_or_none():
            raise ValueError("EMAIL_EXISTS")
        user.email = email

    if nombre_completo is not None:
        user.nombre_completo = nombre_completo

    user.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(user, ["rol", "preferencias"])

    return user


async def change_user_password(
    db: AsyncSession,
    user: Usuario,
    current_password: str,
    new_password: str,
    confirm_password: str,
) -> str:
    """Change the current user's password."""
    if new_password != confirm_password:
        raise ValueError("PASSWORDS_DONT_MATCH")

    if not verify_password(current_password, user.password_hash):
        raise ValueError("INVALID_CURRENT_PASSWORD")

    user.password_hash = hash_password(new_password)
    user.fecha_actualizacion = datetime.now(timezone.utc)
    await db.flush()

    return "Contraseña cambiada exitosamente"


async def get_preferencias(db: AsyncSession, user: Usuario) -> PreferenciasOut:
    """Get the current user's preferences."""
    if not user.preferencias:
        prefs = PreferenciasUsuario(
            usuario_id=user.id,
            idioma="es",
            tema_visual="light",
            configuracion_regional="es-MX",
        )
        db.add(prefs)
        await db.flush()
        await db.refresh(user, ["preferencias"])

    return PreferenciasOut(
        idioma=user.preferencias.idioma,
        tema_visual=user.preferencias.tema_visual,
        zona_horaria=user.preferencias.configuracion_regional,
    )


async def update_preferencias(
    db: AsyncSession,
    user: Usuario,
    idioma: Optional[str],
    tema_visual: Optional[str],
    zona_horaria: Optional[str],
) -> PreferenciasOut:
    """Update the current user's preferences."""
    if not user.preferencias:
        prefs = PreferenciasUsuario(
            usuario_id=user.id,
            idioma="es",
            tema_visual="light",
            configuracion_regional="es-MX",
        )
        db.add(prefs)
        await db.flush()
        await db.refresh(user, ["preferencias"])

    if idioma is not None:
        user.preferencias.idioma = idioma
    if tema_visual is not None:
        user.preferencias.tema_visual = tema_visual
    if zona_horaria is not None:
        user.preferencias.configuracion_regional = zona_horaria

    await db.flush()
    await db.refresh(user.preferencias)

    return PreferenciasOut(
        idioma=user.preferencias.idioma,
        tema_visual=user.preferencias.tema_visual,
        zona_horaria=user.preferencias.configuracion_regional,
    )
