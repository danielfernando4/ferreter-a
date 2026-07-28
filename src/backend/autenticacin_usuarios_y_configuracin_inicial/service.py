from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from config import ROLES

from . import models as mdl
from . import schemas as sch
from .utils import (
    generate_token,
    get_expires_in_seconds,
    get_reset_token_expiry,
    get_token_expiry,
    hash_password,
    hash_token,
    verify_password,
)


# ─── Setup ──────────────────────────────────────────────────────────────────

async def verificar_estado_setup(db: AsyncSession) -> Tuple[bool, bool]:
    """Verifica si el setup está completado y si existe algún admin."""
    result = await db.execute(
        select(mdl.ConfiguracionNegocio).limit(1),
    )
    config = result.scalar_one_or_none()

    result = await db.execute(
        select(mdl.Usuario)
        .join(mdl.Rol)
        .where(mdl.Rol.nombre == "administrador", mdl.Usuario.activo == True)
        .limit(1),
    )
    admin = result.scalar_one_or_none()

    setup_completed = config is not None and config.setup_completado
    admin_exists = admin is not None
    return setup_completed, admin_exists


async def ejecutar_setup(
    db: AsyncSession,
    data: sch.SetupRequest,
) -> mdl.Usuario:
    """Ejecuta la configuración inicial del sistema."""
    # Verificar que no exista ya un admin
    result = await db.execute(
        select(mdl.Usuario)
        .join(mdl.Rol)
        .where(mdl.Rol.nombre == "administrador", mdl.Usuario.activo == True)
        .limit(1),
    )
    admin_existente = result.scalar_one_or_none()
    if admin_existente:
        raise ValueError("SETUP_ALREADY_COMPLETED")

    # Verificar que el email no esté registrado
    result = await db.execute(
        select(mdl.Usuario).where(mdl.Usuario.email == data.email).limit(1),
    )
    if result.scalar_one_or_none():
        raise ValueError("EMAIL_EXISTS")

    # Crear configuración del negocio
    config = mdl.ConfiguracionNegocio(
        nombre=data.negocio_nombre,
        direccion=data.negocio_direccion,
        datos_fiscales=data.negocio_rfc,
        telefono=data.negocio_telefono,
        setup_completado=True,
    )
    db.add(config)

    # Crear o obtener el rol administrador
    result = await db.execute(
        select(mdl.Rol).where(mdl.Rol.nombre == "administrador").limit(1),
    )
    rol = result.scalar_one_or_none()
    if not rol:
        # Crear roles si no existen
        for nombre, descripcion in ROLES.items():
            db.add(mdl.Rol(nombre=nombre, descripcion=descripcion))
        await db.flush()
        result = await db.execute(
            select(mdl.Rol).where(mdl.Rol.nombre == "administrador").limit(1),
        )
        rol = result.scalar_one()

    # Crear el usuario administrador
    usuario = mdl.Usuario(
        nombre_completo=data.nombre_completo,
        email=data.email,
        password_hash=hash_password(data.password),
        rol_id=rol.id,
        activo=True,
    )
    db.add(usuario)
    await db.flush()

    # Crear preferencias por defecto
    preferencias = mdl.PreferenciasUsuario(
        usuario_id=usuario.id,
        idioma="es",
        tema_visual="light",
        configuracion_regional="es-MX",
    )
    db.add(preferencias)
    await db.commit()
    await db.refresh(usuario)
    return usuario


# ─── Autenticación ──────────────────────────────────────────────────────────

async def autenticar_usuario(
    db: AsyncSession,
    email: str,
    password: str,
    remember: bool = False,
) -> Tuple[str, int, mdl.Usuario]:
    """Autentica un usuario y genera un token de sesión."""
    result = await db.execute(
        select(mdl.Usuario)
        .options(joinedload(mdl.Usuario.rol))
        .where(mdl.Usuario.email == email, mdl.Usuario.activo == True)
        .limit(1),
    )
    usuario = result.scalar_one_or_none()

    if not usuario or not verify_password(password, usuario.password_hash):
        raise ValueError("INVALID_CREDENTIALS")

    # Generar token
    token = generate_token()
    token_hash = hash_token(token)
    expiry = get_token_expiry(remember)

    token_sesion = mdl.TokenSesion(
        usuario_id=usuario.id,
        token_hash=token_hash,
        es_persistente=remember,
        fecha_expiracion=expiry,
        activo=True,
    )
    db.add(token_sesion)

    # Actualizar último acceso
    usuario.ultimo_acceso = datetime.now(timezone.utc)
    await db.commit()

    expires_in = get_expires_in_seconds(expiry)
    return token, expires_in, usuario


async def cerrar_sesion(db: AsyncSession, token_hash: str) -> None:
    """Invalida un token de sesión."""
    result = await db.execute(
        select(mdl.TokenSesion)
        .where(mdl.TokenSesion.token_hash == token_hash)
        .limit(1),
    )
    token_sesion = result.scalar_one_or_none()
    if token_sesion:
        token_sesion.activo = False
        await db.commit()


async def obtener_usuario_por_token(
    db: AsyncSession,
    token: str,
) -> Optional[mdl.Usuario]:
    """Obtiene el usuario asociado a un token válido."""
    token_hash = hash_token(token)

    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(mdl.TokenSesion)
        .where(
            mdl.TokenSesion.token_hash == token_hash,
            mdl.TokenSesion.activo == True,
            mdl.TokenSesion.fecha_expiracion > now,
        )
        .limit(1),
    )
    token_sesion = result.scalar_one_or_none()
    if not token_sesion:
        return None

    result = await db.execute(
        select(mdl.Usuario)
        .options(joinedload(mdl.Usuario.rol))
        .where(mdl.Usuario.id == token_sesion.usuario_id)
        .limit(1),
    )
    return result.scalar_one_or_none()


async def invalidar_tokens_usuario(db: AsyncSession, usuario_id: int) -> None:
    """Invalida todos los tokens activos de un usuario."""
    await db.execute(
        update(mdl.TokenSesion)
        .where(
            mdl.TokenSesion.usuario_id == usuario_id,
            mdl.TokenSesion.activo == True,
        )
        .values(activo=False),
    )
    await db.commit()


# ─── Recuperación de Contraseña ─────────────────────────────────────────────

async def crear_token_restablecimiento(
    db: AsyncSession,
    email: str,
) -> str:
    """Crea un token de restablecimiento de contraseña."""
    result = await db.execute(
        select(mdl.Usuario).where(mdl.Usuario.email == email).limit(1),
    )
    usuario = result.scalar_one_or_none()
    if not usuario:
        # No revelar si el email existe
        return ""

    token = generate_token()
    token_hash_val = hash_token(token)

    reset_token = mdl.TokenRestablecimiento(
        usuario_id=usuario.id,
        token_hash=token_hash_val,
        fecha_expiracion=get_reset_token_expiry(),
        utilizado=False,
    )
    db.add(reset_token)
    await db.commit()
    return token


async def verificar_token_restablecimiento(
    db: AsyncSession,
    token: str,
) -> Optional[mdl.Usuario]:
    """Verifica un token de restablecimiento y devuelve el usuario si es válido."""
    token_hash_val = hash_token(token)

    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(mdl.TokenRestablecimiento)
        .where(
            mdl.TokenRestablecimiento.token_hash == token_hash_val,
            mdl.TokenRestablecimiento.utilizado == False,
            mdl.TokenRestablecimiento.fecha_expiracion > now,
        )
        .limit(1),
    )
    reset_token = result.scalar_one_or_none()
    if not reset_token:
        return None

    result = await db.execute(
        select(mdl.Usuario).where(mdl.Usuario.id == reset_token.usuario_id).limit(1),
    )
    return result.scalar_one_or_none()


async def restablecer_password(
    db: AsyncSession,
    token: str,
    new_password: str,
) -> Optional[mdl.Usuario]:
    """Restablece la contraseña usando un token válido."""
    token_hash_val = hash_token(token)

    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(mdl.TokenRestablecimiento)
        .where(
            mdl.TokenRestablecimiento.token_hash == token_hash_val,
            mdl.TokenRestablecimiento.utilizado == False,
            mdl.TokenRestablecimiento.fecha_expiracion > now,
        )
        .limit(1),
    )
    reset_token = result.scalar_one_or_none()
    if not reset_token:
        return None

    result = await db.execute(
        select(mdl.Usuario).where(mdl.Usuario.id == reset_token.usuario_id).limit(1),
    )
    usuario = result.scalar_one_or_none()
    if not usuario:
        return None

    # Actualizar contraseña
    usuario.password_hash = hash_password(new_password)
    usuario.fecha_actualizacion = datetime.now(timezone.utc)

    # Invalidar token
    reset_token.utilizado = True

    # Invalidar todos los tokens de sesión del usuario
    await invalidar_tokens_usuario(db, usuario.id)

    await db.commit()
    await db.refresh(usuario)
    return usuario


# ─── Gestión de Usuarios ────────────────────────────────────────────────────

async def listar_usuarios(
    db: AsyncSession,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
) -> Tuple[List[mdl.Usuario], int]:
    """Lista usuarios con paginación y búsqueda opcional."""
    query = (
        select(mdl.Usuario)
        .options(joinedload(mdl.Usuario.rol))
        .order_by(mdl.Usuario.id)
    )

    count_query = select(func.count(mdl.Usuario.id))

    if search:
        search_filter = mdl.Usuario.nombre_completo.ilike(f"%{search}%") | \
            mdl.Usuario.email.ilike(f"%{search}%")
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    # Obtener total
    result = await db.execute(count_query)
    total = result.scalar() or 0

    # Paginación
    total_pages = max(1, (total + page_size - 1) // page_size)
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    usuarios = list(result.scalars().unique().all())

    return usuarios, total


async def obtener_usuario_por_id(
    db: AsyncSession,
    usuario_id: int,
) -> Optional[mdl.Usuario]:
    """Obtiene un usuario por su ID."""
    result = await db.execute(
        select(mdl.Usuario)
        .options(joinedload(mdl.Usuario.rol))
        .where(mdl.Usuario.id == usuario_id)
        .limit(1),
    )
    return result.scalar_one_or_none()


async def crear_usuario(
    db: AsyncSession,
    data: sch.UserCreateRequest,
) -> mdl.Usuario:
    """Crea un nuevo usuario."""
    # Verificar email único
    result = await db.execute(
        select(mdl.Usuario).where(mdl.Usuario.email == data.email).limit(1),
    )
    if result.scalar_one_or_none():
        raise ValueError("EMAIL_EXISTS")

    # Obtener rol
    result = await db.execute(
        select(mdl.Rol).where(mdl.Rol.nombre == data.rol).limit(1),
    )
    rol = result.scalar_one_or_none()
    if not rol:
        raise ValueError("INVALID_ROLE")

    usuario = mdl.Usuario(
        nombre_completo=data.nombre_completo,
        email=data.email,
        password_hash=hash_password(data.password),
        rol_id=rol.id,
        activo=True,
    )
    db.add(usuario)
    await db.flush()

    # Crear preferencias por defecto
    preferencias = mdl.PreferenciasUsuario(
        usuario_id=usuario.id,
        idioma="es",
        tema_visual="light",
        configuracion_regional="es-MX",
    )
    db.add(preferencias)
    await db.commit()
    await db.refresh(usuario)

    # Recargar con rol para la respuesta
    result = await db.execute(
        select(mdl.Usuario)
        .options(joinedload(mdl.Usuario.rol))
        .where(mdl.Usuario.id == usuario.id)
        .limit(1),
    )
    return result.scalar_one()


async def actualizar_usuario(
    db: AsyncSession,
    usuario_id: int,
    data: sch.UserUpdateRequest,
) -> Optional[mdl.Usuario]:
    """Actualiza los datos de un usuario."""
    result = await db.execute(
        select(mdl.Usuario)
        .options(joinedload(mdl.Usuario.rol))
        .where(mdl.Usuario.id == usuario_id)
        .limit(1),
    )
    usuario = result.scalar_one_or_none()
    if not usuario:
        return None

    # Verificar email único si cambia
    if data.email is not None and data.email != usuario.email:
        result = await db.execute(
            select(mdl.Usuario)
            .where(mdl.Usuario.email == data.email, mdl.Usuario.id != usuario_id)
            .limit(1),
        )
        if result.scalar_one_or_none():
            raise ValueError("EMAIL_EXISTS")
        usuario.email = data.email

    if data.nombre_completo is not None:
        usuario.nombre_completo = data.nombre_completo

    if data.rol is not None:
        result = await db.execute(
            select(mdl.Rol).where(mdl.Rol.nombre == data.rol).limit(1),
        )
        rol = result.scalar_one_or_none()
        if not rol:
            raise ValueError("INVALID_ROLE")
        usuario.rol_id = rol.id

    usuario.fecha_actualizacion = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(usuario)

    # Recargar con rol
    result = await db.execute(
        select(mdl.Usuario)
        .options(joinedload(mdl.Usuario.rol))
        .where(mdl.Usuario.id == usuario_id)
        .limit(1),
    )
    return result.scalar_one()


async def desactivar_usuario(
    db: AsyncSession,
    usuario_id: int,
) -> Optional[mdl.Usuario]:
    """Desactiva un usuario."""
    result = await db.execute(
        select(mdl.Usuario)
        .options(joinedload(mdl.Usuario.rol))
        .where(mdl.Usuario.id == usuario_id)
        .limit(1),
    )
    usuario = result.scalar_one_or_none()
    if not usuario:
        return None

    usuario.activo = False
    usuario.fecha_actualizacion = datetime.now(timezone.utc)

    # Invalidar todos los tokens de sesión
    await invalidar_tokens_usuario(db, usuario.id)

    await db.commit()
    await db.refresh(usuario)

    # Recargar con rol
    result = await db.execute(
        select(mdl.Usuario)
        .options(joinedload(mdl.Usuario.rol))
        .where(mdl.Usuario.id == usuario_id)
        .limit(1),
    )
    return result.scalar_one()


async def reactivar_usuario(
    db: AsyncSession,
    usuario_id: int,
) -> Optional[mdl.Usuario]:
    """Reactivar un usuario desactivado."""
    result = await db.execute(
        select(mdl.Usuario)
        .options(joinedload(mdl.Usuario.rol))
        .where(mdl.Usuario.id == usuario_id)
        .limit(1),
    )
    usuario = result.scalar_one_or_none()
    if not usuario:
        return None

    usuario.activo = True
    usuario.fecha_actualizacion = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(usuario)

    # Recargar con rol
    result = await db.execute(
        select(mdl.Usuario)
        .options(joinedload(mdl.Usuario.rol))
        .where(mdl.Usuario.id == usuario_id)
        .limit(1),
    )
    return result.scalar_one()


# ─── Perfil ─────────────────────────────────────────────────────────────────

async def obtener_perfil_completo(
    db: AsyncSession,
    usuario_id: int,
) -> Tuple[Optional[mdl.Usuario], Optional[mdl.PreferenciasUsuario]]:
    """Obtiene el perfil completo de un usuario."""
    result = await db.execute(
        select(mdl.Usuario)
        .options(joinedload(mdl.Usuario.rol))
        .where(mdl.Usuario.id == usuario_id)
        .limit(1),
    )
    usuario = result.scalar_one_or_none()

    if not usuario:
        return None, None

    result = await db.execute(
        select(mdl.PreferenciasUsuario)
        .where(mdl.PreferenciasUsuario.usuario_id == usuario_id)
        .limit(1),
    )
    preferencias = result.scalar_one_or_none()

    return usuario, preferencias


async def actualizar_perfil(
    db: AsyncSession,
    usuario_id: int,
    data: sch.UserUpdateRequest,
) -> Optional[mdl.Usuario]:
    """Actualiza el perfil del usuario (solo nombre y email)."""
    return await actualizar_usuario(db, usuario_id, data)


async def cambiar_password(
    db: AsyncSession,
    usuario_id: int,
    current_password: str,
    new_password: str,
) -> bool:
    """Cambia la contraseña del usuario."""
    result = await db.execute(
        select(mdl.Usuario).where(mdl.Usuario.id == usuario_id).limit(1),
    )
    usuario = result.scalar_one_or_none()
    if not usuario:
        return False

    if not verify_password(current_password, usuario.password_hash):
        raise ValueError("INVALID_CURRENT_PASSWORD")

    usuario.password_hash = hash_password(new_password)
    usuario.fecha_actualizacion = datetime.now(timezone.utc)

    # Invalidar todos los tokens excepto el actual (se maneja en routes)
    await db.commit()
    return True


async def obtener_preferencias(
    db: AsyncSession,
    usuario_id: int,
) -> Optional[mdl.PreferenciasUsuario]:
    """Obtiene las preferencias de un usuario."""
    result = await db.execute(
        select(mdl.PreferenciasUsuario)
        .where(mdl.PreferenciasUsuario.usuario_id == usuario_id)
        .limit(1),
    )
    return result.scalar_one_or_none()


async def actualizar_preferencias(
    db: AsyncSession,
    usuario_id: int,
    data: sch.PreferenciasUpdateRequest,
) -> Optional[mdl.PreferenciasUsuario]:
    """Actualiza las preferencias de un usuario."""
    result = await db.execute(
        select(mdl.PreferenciasUsuario)
        .where(mdl.PreferenciasUsuario.usuario_id == usuario_id)
        .limit(1),
    )
    preferencias = result.scalar_one_or_none()

    if not preferencias:
        preferencias = mdl.PreferenciasUsuario(usuario_id=usuario_id)
        db.add(preferencias)

    if data.idioma is not None:
        preferencias.idioma = data.idioma
    if data.tema_visual is not None:
        preferencias.tema_visual = data.tema_visual
    if data.zona_horaria is not None:
        preferencias.configuracion_regional = data.zona_horaria

    await db.commit()
    await db.refresh(preferencias)
    return preferencias
