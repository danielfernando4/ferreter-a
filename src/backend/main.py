from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine

from autenticacin_usuarios_y_configuracin_inicial.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title="Ferretería MVP - Backend",
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
app.include_router(
    router,
    prefix="/api/autenticacin_usuarios_y_configuracin_inicial",
)


@app.get('/health')
async def health_check():
    return {"status": "ok", "message": "Ferretería MVP API is running"}
