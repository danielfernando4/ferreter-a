from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from database import Base, engine, async_session

from autenticacin_usuarios_y_configuracin_inicial.routes import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed roles if needed
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed default roles
    async with async_session() as session:
        from autenticacin_usuarios_y_configuracin_inicial.models import Rol

        result = await session.execute(text("SELECT COUNT(*) FROM roles"))
        count = result.scalar()
        if count == 0:
            session.add_all([
                Rol(nombre="administrador", descripcion="Acceso total al sistema. Gestión de usuarios, configuración y reportes."),
                Rol(nombre="vendedor", descripcion="Acceso al punto de venta y consulta de inventario."),
                Rol(nombre="almacen", descripcion="Acceso a inventario y órdenes de compra."),
            ])
            await session.commit()
    yield


app = FastAPI(
    title="Ferretería - Sistema de Gestión",
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

# Routers
app.include_router(auth_router, prefix="/api/autenticacin_usuarios_y_configuracin_inicial")


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
