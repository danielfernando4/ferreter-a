from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="Ferretería",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === AGENT: ADD YOUR ROUTER BELOW ===
from autenticacin_usuarios_y_configuracin_inicial.routes import router as auth_router
app.include_router(auth_router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
