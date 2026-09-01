"""
Multilingual Category Templates for Zero-Shot Semantic Classification.
Includes English, Hindi, and Hinglish examples for civic complaint categories.
"""
from typing import Optional

CATEGORY_DEPARTMENT_MAPPING = {
    "sanitation": "Solid Waste & Sanitation",
    "water": "Water Supply",
    "roads": "Roads & Infrastructure",
    "streetlights": "Electrical / Street Lighting",
    "health": "Public Health & Vector Control",
    "traffic": "Traffic & Public Transport",
    "general_review": "General Review Queue"
}

DEPARTMENT_KEY_MAP = {
    "sanitation": "sanitation",
    "water": "water",
    "roads": "roads",
    "streetlights": "streetlights",
    "health": "health",
    "traffic": "traffic"
}

CATEGORY_ALIASES = {
    "water": "water",
    "water_supply": "water",
    "water supply": "water",
    "sanitation": "sanitation",
    "solid_waste": "sanitation",
    "solid_waste_sanitation": "sanitation",
    "solid waste & sanitation": "sanitation",
    "roads": "roads",
    "roads_infrastructure": "roads",
    "roads & infrastructure": "roads",
    "streetlights": "streetlights",
    "electrical": "streetlights",
    "electrical_streetlights": "streetlights",
    "electrical / street lighting": "streetlights",
    "health": "health",
    "public_health": "health",
    "public health & vector control": "health",
    "traffic": "traffic",
    "traffic_transport": "traffic",
    "traffic & public transport": "traffic",
    "general_review": "general_review",
    "general review queue": "general_review",
}


def normalize_category(category_or_dept: Optional[str]) -> Optional[str]:
    """Normalizes any category alias or department name to canonical category key."""
    if not category_or_dept:
        return None
    key = str(category_or_dept).lower().strip()
    return CATEGORY_ALIASES.get(key, key)


CATEGORY_TEMPLATES = {
    "sanitation": [
        "garbage collection missed, waste overflowing, litter on road, dumpster full",
        "unclean street, garbage pile, solid waste disposal complaint, smelly trash",
        "kachra nahi uthaya gaya, gandi safai aur kooda jama hai, badboo aa rahi hai",
        "कचरा नहीं उठाया गया, गंदगी और कूड़ा जमा है, बदबू आ रही है"
    ],
    "water": [
        "water supply unavailable, pipeline leak, water pressure issue, contaminated water",
        "drinking water pipe burst, muddy water from tap, valve leaking",
        "paani nahi aa raha hai, pipe se leakage ho raha hai, ganda paani",
        "पानी नहीं आ रहा है, पानी की पाइपलाइन से रिसाव हो रहा है, गंदा पानी"
    ],
    "roads": [
        "pothole, damaged road surface, broken footpath, asphalt crater, open trench",
        "caved in walkway, dangerous road hole, speed breaker faded",
        "sadak mein gaddha hai aur road kharab hai, rasta tuta hai",
        "सड़क में गड्ढा है और सड़क खराब है, फुटपाथ टूटा हुआ है"
    ],
    "streetlights": [
        "streetlight not working, dark lane at night, exposed electrical wire, pole leaning",
        "light fixture off, transformer sparking, electric shock hazard",
        "street light band hai, gali andheri hai, wire exposed hai, light nahi jal rahi",
        "स्ट्रीट लाइट खराब है और सड़क अंधेरी है, खुला हुआ तार"
    ],
    "health": [
        "mosquito breeding, stagnant water pool, sanitation health hazard, disease risk",
        "dengue hazard, stray dogs biting, foul smell, open drainage pool",
        "machhar badh rahe hain, ganda paani jama hai, dengue ka dar",
        "मच्छरों का प्रकोप और रुका हुआ गंदा पानी, बीमारी का खतरा"
    ],
    "traffic": [
        "traffic signal not working, dangerous junction, bus stop issue, illegal parking",
        "signal light off, congestion at intersection, ambulance path blocked",
        "traffic signal kharab hai aur junction par jam hai, gaadi block hai",
        "ट्रैफिक सिग्नल खराब है और जाम लग रहा है, रास्ता बंद है"
    ]
}
