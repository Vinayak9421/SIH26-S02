"""
Multilingual Category Templates for Zero-Shot Semantic Classification.
Includes English, Hindi, and Hinglish examples for civic complaint categories.
"""

CATEGORY_DEPARTMENT_MAPPING = {
    "sanitation": "Solid Waste & Sanitation",
    "water": "Water Supply",
    "roads": "Roads & Infrastructure",
    "streetlights": "Electrical / Street Lighting",
    "health": "Public Health & Vector Control",
    "traffic": "Traffic & Public Transport",
    "general_review": "General Review Queue"
}

CATEGORY_TEMPLATES = {
    "sanitation": [
        "garbage collection missed, waste overflowing, litter on road, uncleaned trash dump",
        "unclean street, garbage pile, solid waste disposal complaint, smelly dustbin",
        "kachra nahi uthaya gaya, gandi safai aur kooda jama hai, badbu aa rahi hai",
        "कचरा नहीं उठाया गया, गंदगी और कूड़ा जमा है, सफाई नहीं हुई",
        "school ke paas kachra pada hai, dustbin overflowing"
    ],
    "water": [
        "water supply unavailable, pipeline leak, water pressure issue, dirty contaminated water",
        "drinking water problem, tap dry, water supply disruption, water tanker issue",
        "paani nahi aa raha hai, pipe se leakage ho raha hai, ganda paani aa raha hai",
        "पानी नहीं आ रहा है, पानी की पाइपलाइन से रिसाव हो रहा है, पानी का दबाव कम है",
        "no water supply for three days in colony"
    ],
    "roads": [
        "pothole, damaged road, broken footpath, unsafe road surface, crater on road",
        "tar damaged, road repair needed, manhole cover broken on road, asphalt uneven",
        "sadak mein gaddha hai aur road kharab hai, footpath toota hua hai",
        "सड़क में गड्ढा है और सड़क खराब है, गड्ढे के कारण दुर्घटना का खतरा है",
        "huge potholes causing traffic and accidents on highway"
    ],
    "streetlights": [
        "streetlight not working, dark lane, exposed electrical wire, pole damaged",
        "bulb fused on streetlight, power pole sparking, electrical hazard on road",
        "street light band hai, gali andheri hai, wire exposed hai, transformer kharab hai",
        "स्ट्रीट लाइट खराब है और सड़क अंधेरी है, खुला बिजली का तार लटक रहा है",
        "dark street at night due to non-functioning street lamp"
    ],
    "health": [
        "mosquito breeding, stagnant water, sanitation health hazard, dengue risk",
        "open drain, sewage overflow, public health danger, epidemic risk, contaminated surroundings",
        "machhar badh rahe hain, ganda paani jama hai, bimari phailne ka darr hai",
        "मच्छरों का प्रकोप और रुका हुआ गंदा पानी, डेंगू मलेरिया का खतरा",
        "mosquito menace due to open stagnant puddle near residential building"
    ],
    "traffic": [
        "traffic signal not working, dangerous junction, bus service issue, signal red light stuck",
        "traffic congestion, illegally parked vehicles blocking road, zebra crossing missing",
        "traffic signal kharab hai aur junction par jam hai, bus route problem hai",
        "ट्रैफिक सिग्नल खराब है और जाम लग रहा है, चौराहा खतरनाक हो गया है",
        "traffic light failure causing severe gridlock at intersection"
    ]
}
