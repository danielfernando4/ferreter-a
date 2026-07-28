from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from autenticacin_usuarios_y_configuracin_inicial.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="Ferretería API - Autenticación, Usuarios y Configuración Inicial",
    description="API para el módulo de autenticación, gestión de usuarios y configuración inicial del sistema Ferretería.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS: allow all origins for local MVP
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register router at /api prefix
app.include_router(router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok", "module": "autenticacin_usuarios_y_configuracin_inicial"}
