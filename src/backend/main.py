from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base, async_session
from autenticacin_usuarios_y_configuracin_inicial.models import (
    Rol,
    Usuario,
    ConfiguracionNegocio,
    PreferenciasUsuario,
    TokenSesion,
    TokenRestablecimiento,
)
from autenticacin_usuarios_y_configuracin_inicial.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown: dispose engine
    await engine.dispose()


app = FastAPI(
    title="Ferretera - Sistema de Gestión",
    description="API de Autenticación, Usuarios y Configuración Inicial",
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

# Register router
app.include_router(router, prefix="/api/autenticacin_usuarios_y_configuracin_inicial")


@app.get("/health")
async def health():
    return {"status": "ok"}
