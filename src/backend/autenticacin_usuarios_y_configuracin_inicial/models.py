from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Rol(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)

    usuarios: Mapped[list["Usuario"]] = relationship(
        "Usuario", back_populates="rol", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Rol {self.nombre}>"


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre_completo: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    rol_id: Mapped[int] = mapped_column(Integer, ForeignKey("roles.id"), nullable=False)
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    fecha_actualizacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=datetime.now(timezone.utc),
        nullable=False,
    )

    rol: Mapped["Rol"] = relationship("Rol", back_populates="usuarios", lazy="selectin")
    preferencias: Mapped[list["PreferenciasUsuario"]] = relationship(
        "PreferenciasUsuario", back_populates="usuario", lazy="selectin", uselist=False
    )
    tokens_sesion: Mapped[list["TokenSesion"]] = relationship(
        "TokenSesion", back_populates="usuario", lazy="selectin"
    )
    tokens_restablecimiento: Mapped[list["TokenRestablecimiento"]] = relationship(
        "TokenRestablecimiento", back_populates="usuario", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Usuario {self.email}>"


class ConfiguracionNegocio(Base):
    __tablename__ = "configuracion_negocio"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    direccion: Mapped[str] = mapped_column(Text, nullable=False)
    datos_fiscales: Mapped[str] = mapped_column(String(255), nullable=False)
    telefono: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email_contacto: Mapped[str | None] = mapped_column(String(255), nullable=True)
    setup_completado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<ConfiguracionNegocio {self.nombre}>"


class PreferenciasUsuario(Base):
    __tablename__ = "preferencias_usuario"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("usuarios.id"), unique=True, nullable=False
    )
    idioma: Mapped[str] = mapped_column(String(10), default="es", nullable=False)
    tema_visual: Mapped[str] = mapped_column(String(20), default="light", nullable=False)
    configuracion_regional: Mapped[str] = mapped_column(
        String(20), default="es-MX", nullable=False
    )

    usuario: Mapped["Usuario"] = relationship(
        "Usuario", back_populates="preferencias", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<PreferenciasUsuario user={self.usuario_id}>"


class TokenSesion(Base):
    __tablename__ = "tokens_sesion"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("usuarios.id"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    es_persistente: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    fecha_expiracion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    usuario: Mapped["Usuario"] = relationship(
        "Usuario", back_populates="tokens_sesion", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<TokenSesion user={self.usuario_id}>"


class TokenRestablecimiento(Base):
    __tablename__ = "tokens_restablecimiento"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("usuarios.id"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    fecha_expiracion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    utilizado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    usuario: Mapped["Usuario"] = relationship(
        "Usuario", back_populates="tokens_restablecimiento", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<TokenRestablecimiento user={self.usuario_id}>"
