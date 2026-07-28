from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from autenticacin_usuarios_y_configuracin_inicial.routes import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown: nothing to clean up


app = FastAPI(
    title="Ferretera POS API",
    description="API del sistema Ferretería POS",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix="/api/autenticacin_usuarios_y_configuracin_inicial")


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
