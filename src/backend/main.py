from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from autenticacin_usuarios_y_configuracin_inicial.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown: dispose engine
    await engine.dispose()


app = FastAPI(title="Ferretería API", version="1.0.0", lifespan=lifespan)

# CORS - allow all origins for local MVP
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the auth/usuarios/perfil router
app.include_router(router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "message": "Ferretería API is running"}
