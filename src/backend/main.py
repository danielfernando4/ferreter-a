from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from database import engine, Base, async_session
from autenticacin_usuarios_y_configuracin_inicial.models import Rol
from autenticacin_usuarios_y_configuracin_inicial.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed default roles if they don't exist
    async with async_session() as session:
        for rol_data in [
            ("administrador", "Administrador del sistema con acceso completo a todos los módulos"),
            ("vendedor", "Vendedor / Cajero con acceso al punto de venta y consulta de inventario"),
            ("almacen", "Encargado de almacén / compras con acceso a inventario y órdenes de compra"),
        ]:
            result = await session.execute(select(Rol).where(Rol.nombre == rol_data[0]))
            if result.scalar_one_or_none() is None:
                session.add(Rol(nombre=rol_data[0], descripcion=rol_data[1]))
        await session.commit()

    yield

    # Cleanup
    await engine.dispose()


app = FastAPI(
    title="Ferretera MVP - Backend",
    description="API REST para sistema de ferretería",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - allow all origins for local MVP
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(router, prefix="/api/autenticacin_usuarios_y_configuracin_inicial")


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Ferretera MVP API is running"}
