from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base, async_session
from autenticacin_usuarios_y_configuracin_inicial.models import Usuario, Rol, ConfiguracionNegocio, PreferenciasUsuario, TokenSesion, TokenRestablecimiento
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
    title="Ferretera API - Autenticación, Usuarios y Configuración Inicial",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - allow all origins for MVP
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/api/health")
async def health():
    return {"status": "ok", "module": "autenticacin_usuarios_y_configuracin_inicial"}


# Include the router
app.include_router(router, prefix="/api/autenticacin_usuarios_y_configuracin_inicial")
