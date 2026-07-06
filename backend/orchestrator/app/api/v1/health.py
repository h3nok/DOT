from app.core.health import create_health_router
from app.db.session import check_database
from app.settings import get_settings


async def database_ready() -> str:
    await check_database()
    return "ok"


settings = get_settings()
router = create_health_router(
    service_name=settings.SERVICE_NAME,
    version="0.1.0",
    readiness_checks={"database": database_ready},
)
