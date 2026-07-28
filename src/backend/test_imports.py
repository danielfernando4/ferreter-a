"""Quick verification that all imports work correctly."""
import sys
sys.path.insert(0, '/app/backend')

try:
    from autenticacin_usuarios_y_configuracin_inicial.models import (
        Rol, Usuario, ConfiguracionNegocio, PreferenciasUsuario,
        TokenSesion, TokenRestablecimiento
    )
    print(f"models OK: {Rol.__tablename__}, {Usuario.__tablename__}")

    from autenticacin_usuarios_y_configuracin_inicial.schemas import (
        UserOut, LoginRequest, SetupRequest, SetupResponse,
        PaginatedUsersResponse, PerfilResponse
    )
    print(f"schemas OK: {UserOut.model_fields.keys()}")

    from autenticacin_usuarios_y_configuracin_inicial.utils import hash_password, verify_password
    pw_hash = hash_password("test123")
    assert verify_password("test123", pw_hash)
    print("utils OK: password hashing works")

    from autenticacin_usuarios_y_configuracin_inicial.service import ROLES_VALIDOS
    print(f"service OK: roles = {ROLES_VALIDOS}")

    from autenticacin_usuarios_y_configuracin_inicial.dependencies import get_current_user, require_admin
    print("dependencies OK")

    from autenticacin_usuarios_y_configuracin_inicial.routes import router
    print(f"routes OK: {len(router.routes)} routes defined")

    # Test main.py imports
    import importlib
    spec = importlib.util.spec_from_file_location('main', '/app/backend/main.py')
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    print(f"main.py OK: app with {len(mod.app.routes)} total routes")

except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
