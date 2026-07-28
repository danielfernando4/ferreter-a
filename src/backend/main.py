from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine, async_session
from autenticacin_usuarios_y_configuracin_inicial.routes import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown: dispose engine
    await engine.dispose()


app = FastAPI(
    title="Ferretera MVP - Backend",
    description="API REST para el sistema de ferretería",
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
app.include_router(
    auth_router,
    prefix="/api/autenticacin_usuarios_y_configuracin_inicial",
)


@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Ferretera API is running"}
