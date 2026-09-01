# Multilingual semantic classification templates for 6 core municipal categories

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

DEPARTMENT_KEY_MAP = {
    "sanitation": "sanitation",
    "water": "water",
    "roads": "roads",
    "streetlights": "streetlights",
    "health": "health",
    "traffic": "traffic"
}

CATEGORY_DEPARTMENT_MAPPING = {
    "sanitation": "Sanitation",
    "water": "Water",
    "roads": "Roads",
    "streetlights": "Streetlights",
    "health": "Health",
    "traffic": "Traffic",
    "general_review": "General Review"
}
