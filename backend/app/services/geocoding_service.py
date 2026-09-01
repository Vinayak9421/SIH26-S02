import logging
import httpx
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_HEADERS = {
    "User-Agent": "CivicIssueAI-SIH2026/1.0 (hackathon@civic.in)"
}


async def geocode_address(address: str) -> Tuple[Optional[float], Optional[float]]:
    """
    Geocode an address string to (latitude, longitude) using OpenStreetMap Nominatim.
    Returns (None, None) if geocoding fails.
    """
    if not address or len(address.strip()) < 3:
        return None, None

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                NOMINATIM_URL,
                params={
                    "q": address,
                    "format": "json",
                    "limit": 1,
                    "countrycodes": "in",  # Prioritise India results
                },
                headers=NOMINATIM_HEADERS,
            )
            data = response.json()
            if data and len(data) > 0:
                lat = float(data[0]["lat"])
                lon = float(data[0]["lon"])
                logger.info(f"Geocoded '{address}' → ({lat}, {lon})")
                return lat, lon
    except Exception as e:
        logger.warning(f"Geocoding failed for '{address}': {e}")

    return None, None


def geocode_address_sync(address: str) -> Tuple[Optional[float], Optional[float]]:
    """
    Synchronous geocode using httpx for use in SQLAlchemy service layer.
    """
    if not address or len(address.strip()) < 3:
        return None, None

    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get(
                NOMINATIM_URL,
                params={
                    "q": address,
                    "format": "json",
                    "limit": 1,
                    "countrycodes": "in",
                },
                headers=NOMINATIM_HEADERS,
            )
            data = response.json()
            if data and len(data) > 0:
                lat = float(data[0]["lat"])
                lon = float(data[0]["lon"])
                logger.info(f"Geocoded '{address}' → ({lat}, {lon})")
                return lat, lon
    except Exception as e:
        logger.warning(f"Geocoding failed for '{address}': {e}")

    return None, None
