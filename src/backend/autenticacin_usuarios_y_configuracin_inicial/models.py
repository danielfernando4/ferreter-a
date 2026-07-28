from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from database import Base


class Rol(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False)
    descripcion = Column(String(255), nullable=False)

    # Relationships
    usuarios = relationship("Usuario", back_populates="rol")

    def __repr__(self):
        return f"<Rol {self.nombre}>"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
    rol_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    ultimo_acceso = Column(DateTime, nullable=True, default=None)
    fecha_creacion = Column(DateTime, server_default="CURRENT_TIMESTAMP", nullable=False)
    fecha_actualizacion = Column(DateTime, server_default="CURRENT_TIMESTAMP", onupdate=datetime.now(timezone.utc), nullable=False)

    # Relationships
    rol = relationship("Rol", back_populates="usuarios")
    tokens_sesion = relationship("TokenSesion", back_populates="usuario", cascade="all, delete-orphan")
    tokens_restablecimiento = relationship("TokenRestablecimiento", back_populates="usuario", cascade="all, delete-orphan")
    preferencias = relationship("PreferenciasUsuario", back_populates="usuario", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Usuario {self.email}>"


class ConfiguracionNegocio(Base):
    __tablename__ = "configuracion_negocio"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    direccion = Column(Text, nullable=False)
    datos_fiscales = Column(String(255), nullable=False)
    telefono = Column(String(20), nullable=True)
    email_contacto = Column(String(255), nullable=True)
    setup_completado = Column(Boolean, default=False, nullable=False)
    fecha_creacion = Column(DateTime, server_default="CURRENT_TIMESTAMP", nullable=False)

    def __repr__(self):
        return f"<ConfiguracionNegocio {self.nombre}>"


class PreferenciasUsuario(Base):
    __tablename__ = "preferencias_usuario"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True, nullable=False)
    idioma = Column(String(10), default="es", nullable=False)
    tema_visual = Column(String(20), default="light", nullable=False)
    configuracion_regional = Column(String(20), default="es-MX", nullable=False)

    # Relationships
    usuario = relationship("Usuario", back_populates="preferencias")

    def __repr__(self):
        return f"<PreferenciasUsuario user={self.usuario_id}>"


class TokenSesion(Base):
    __tablename__ = "tokens_sesion"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    token_hash = Column(String(255), unique=True, nullable=False)
    es_persistente = Column(Boolean, default=False, nullable=False)
    fecha_expiracion = Column(DateTime, nullable=False)
    fecha_creacion = Column(DateTime, server_default="CURRENT_TIMESTAMP", nullable=False)
    activo = Column(Boolean, default=True, nullable=False)

    # Relationships
    usuario = relationship("Usuario", back_populates="tokens_sesion")

    def __repr__(self):
        return f"<TokenSesion user={self.usuario_id}>"


class TokenRestablecimiento(Base):
    __tablename__ = "tokens_restablecimiento"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    token_hash = Column(String(255), unique=True, nullable=False)
    fecha_expiracion = Column(DateTime, nullable=False)
    utilizado = Column(Boolean, default=False, nullable=False)
    fecha_creacion = Column(DateTime, server_default="CURRENT_TIMESTAMP", nullable=False)

    # Relationships
    usuario = relationship("Usuario", back_populates="tokens_restablecimiento")

    def __repr__(self):
        return f"<TokenRestablecimiento user={self.usuario_id}>"
