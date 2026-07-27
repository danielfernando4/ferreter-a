from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from autenticacin_y_gestin_de_usuarios.routes import router

app = FastAPI(title="Autenticación y Gestión de Usuarios", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(router, prefix='/api/autenticacin_y_gestin_de_usuarios')


@app.on_event('startup')
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get('/api/health')
async def health():
    return {'status': 'ok'}
