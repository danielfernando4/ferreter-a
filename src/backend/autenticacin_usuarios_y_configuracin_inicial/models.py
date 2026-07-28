from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship
from database import Base


class Rol(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False)
    descripcion = Column(Text, nullable=False, default="")

    usuarios = relationship("Usuario", back_populates="rol")

    def __repr__(self) -> str:
        return f"<Rol id={self.id} nombre={self.nombre}>"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
    rol_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.now(timezone.utc), server_default=func.now(), nullable=False)
    fecha_actualizacion = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc), server_default=func.now(), nullable=False)
    ultimo_acceso = Column(DateTime, nullable=True)

    rol = relationship("Rol", back_populates="usuarios")
    preferencias = relationship("PreferenciasUsuario", back_populates="usuario", uselist=False, cascade="all, delete-orphan")
    tokens_sesion = relationship("TokenSesion", back_populates="usuario", cascade="all, delete-orphan")
    tokens_restablecimiento = relationship("TokenRestablecimiento", back_populates="usuario", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Usuario id={self.id} email={self.email} rol_id={self.rol_id}>"


class ConfiguracionNegocio(Base):
    __tablename__ = "configuracion_negocio"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    direccion = Column(Text, nullable=False, default="")
    datos_fiscales = Column(String(255), nullable=False, default="")
    telefono = Column(String(50), nullable=True)
    email_contacto = Column(String(255), nullable=True)
    setup_completado = Column(Boolean, default=False, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.now(timezone.utc), server_default=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<ConfiguracionNegocio id={self.id} nombre={self.nombre}>"


class PreferenciasUsuario(Base):
    __tablename__ = "preferencias_usuario"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True, nullable=False)
    idioma = Column(String(10), default="es", nullable=False)
    tema_visual = Column(String(20), default="light", nullable=False)
    configuracion_regional = Column(String(20), default="America/Mexico_City", nullable=False)

    usuario = relationship("Usuario", back_populates="preferencias")

    def __repr__(self) -> str:
        return f"<PreferenciasUsuario usuario_id={self.usuario_id}>"


class TokenSesion(Base):
    __tablename__ = "tokens_sesion"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    token_hash = Column(String(255), unique=True, nullable=False, index=True)
    es_persistente = Column(Boolean, default=False, nullable=False)
    fecha_expiracion = Column(DateTime, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.now(timezone.utc), server_default=func.now(), nullable=False)
    activo = Column(Boolean, default=True, nullable=False)

    usuario = relationship("Usuario", back_populates="tokens_sesion")

    def __repr__(self) -> str:
        return f"<TokenSesion id={self.id} usuario_id={self.usuario_id} activo={self.activo}>"


class TokenRestablecimiento(Base):
    __tablename__ = "tokens_restablecimiento"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    token_hash = Column(String(255), unique=True, nullable=False, index=True)
    fecha_expiracion = Column(DateTime, nullable=False)
    utilizado = Column(Boolean, default=False, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.now(timezone.utc), server_default=func.now(), nullable=False)

    usuario = relationship("Usuario", back_populates="tokens_restablecimiento")

    def __repr__(self) -> str:
        return f"<TokenRestablecimiento id={self.id} usuario_id={self.usuario_id} utilizado={self.utilizado}>"
