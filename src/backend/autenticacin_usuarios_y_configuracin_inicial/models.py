from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Rol(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False, default="")

    usuarios: Mapped[list["Usuario"]] = relationship("Usuario", back_populates="rol")

    def __repr__(self) -> str:
        return f"<Rol {self.nombre}>"


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre_completo: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    rol_id: Mapped[int] = mapped_column(Integer, ForeignKey("roles.id"), nullable=False)
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    fecha_actualizacion: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    ultimo_acceso: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    rol: Mapped["Rol"] = relationship("Rol", back_populates="usuarios")
    preferencias: Mapped["PreferenciasUsuario"] = relationship(
        "PreferenciasUsuario", back_populates="usuario", uselist=False, cascade="all, delete-orphan"
    )
    tokens_sesion: Mapped[list["TokenSesion"]] = relationship(
        "TokenSesion", back_populates="usuario", cascade="all, delete-orphan"
    )
    tokens_restablecimiento: Mapped[list["TokenRestablecimiento"]] = relationship(
        "TokenRestablecimiento", back_populates="usuario", cascade="all, delete-orphan"
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
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
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
    zona_horaria: Mapped[str] = mapped_column(
        String(50), default="America/Mexico_City", nullable=False
    )

    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="preferencias")

    def __repr__(self) -> str:
        return f"<PreferenciasUsuario usuario_id={self.usuario_id}>"


class TokenSesion(Base):
    __tablename__ = "tokens_sesion"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("usuarios.id"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    es_persistente: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    fecha_expiracion: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="tokens_sesion")

    def __repr__(self) -> str:
        return f"<TokenSesion {self.id} usuario_id={self.usuario_id}>"


class TokenRestablecimiento(Base):
    __tablename__ = "tokens_restablecimiento"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("usuarios.id"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    fecha_expiracion: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    utilizado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="tokens_restablecimiento")

    def __repr__(self) -> str:
        return f"<TokenRestablecimiento {self.id} usuario_id={self.usuario_id}>"
