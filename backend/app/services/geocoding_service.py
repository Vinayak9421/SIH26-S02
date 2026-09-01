import logging
import httpx
from typing import Optional, Tuple
from app.config import settings

logger = logging.getLogger(__name__)

OPENCAGE_URL = "https://api.opencagedata.com/geocode/v1/json"


def _geocode_opencage(address: str, api_key: str) -> Tuple[Optional[float], Optional[float]]:
    """Query OpenCage Geocoding API strictly"""
    try:
        with httpx.Client(timeout=5.0) as client:
            res = client.get(
                OPENCAGE_URL,
                params={
                    "q": address,
                    "key": api_key,
                    "countrycode": "in",
                    "limit": 1,
                    "no_annotations": 1,
                }
            )
            if res.status_code == 200:
                data = res.json()
                results = data.get("results", [])
                if results:
                    geom = results[0].get("geometry", {})
                    lat = geom.get("lat")
                    lng = geom.get("lng")
                    if lat is not None and lng is not None:
                        logger.info(f"[OpenCage] Geocoded '{address}' → ({float(lat)}, {float(lng)})")
                        return float(lat), float(lng)
    except Exception as e:
        logger.warning(f"[OpenCage] Geocoding failed for '{address}': {e}")
    return None, None


def geocode_address_sync(address: str) -> Tuple[Optional[float], Optional[float]]:
    """
    Geocode an address string to (latitude, longitude) strictly using OpenCage.
    If OPENCAGE_API_KEY is not configured or address cannot be resolved, returns (None, None).
    """
    if not address or len(address.strip()) < 3:
        return None, None

    # Only geocode if OPENCAGE_API_KEY is configured
    if settings.OPENCAGE_API_KEY and settings.OPENCAGE_API_KEY.strip():
        lat, lon = _geocode_opencage(address, settings.OPENCAGE_API_KEY.strip())
        if lat is not None and lon is not None:
            return lat, lon

    # Return None, None strictly when key is missing or lookup fails
    return None, None


async def geocode_address(address: str) -> Tuple[Optional[float], Optional[float]]:
    """Async wrapper for geocode_address_sync"""
    return geocode_address_sync(address)
