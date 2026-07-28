from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base, async_session
from sqlalchemy import select

from autenticacin_usuarios_y_configuracin_inicial.models import Rol
from autenticacin_usuarios_y_configuracin_inicial.routes import router
from config import ROLES


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database tables and seed roles on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed predefined roles if they don't exist
    async with async_session() as db:
        for nombre, descripcion in ROLES.items():
            result = await db.execute(select(Rol).where(Rol.nombre == nombre))
            existing = result.scalar_one_or_none()
            if existing is None:
                db.add(Rol(nombre=nombre, descripcion=descripcion))
        await db.commit()

    yield


app = FastAPI(
    title="Ferretera API - Autenticación y Usuarios",
    description="Módulo de autenticación, usuarios y configuración inicial",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router
app.include_router(router, prefix="/api/autenticacin_usuarios_y_configuracin_inicial")


@app.get("/health")
async def health():
    return {"status": "ok"}
