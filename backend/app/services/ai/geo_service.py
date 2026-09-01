from math import radians, sin, cos, sqrt, atan2
from typing import Optional

EARTH_RADIUS_M = 6_371_000


def haversine_m(lat1: Optional[float], lon1: Optional[float], lat2: Optional[float], lon2: Optional[float]) -> Optional[float]:
    """
    Computes geographic great-circle distance between two GPS coordinates in meters.
    Returns None if any coordinate is missing.
    """
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return None

    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return EARTH_RADIUS_M * c


def get_hotspot_key(latitude: Optional[float], longitude: Optional[float]) -> Optional[str]:
    """
    Computes geo-grid key for hotspot clustering (approx. 100m grid cell).
    """
    if latitude is None or longitude is None:
        return None
    return f"{round(latitude, 3)}:{round(longitude, 3)}"
