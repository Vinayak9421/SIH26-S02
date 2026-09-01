from dataclasses import dataclass
from typing import List, Dict, Any

SAFETY_TERMS = [
    "fire", "sparking", "electric shock", "exposed wire", "live wire",
    "accident", "collapse", "gas leak", "dangerous", "hazard",
    "आग", "करंट", "खुला तार", "दुर्घटना", "खतरा"
]

EMERGENCY_TERMS = [
    "emergency", "immediately", "urgent", "immediate", "jaldi",
    "तुरंत", "आपातकाल"
]

HEALTH_TERMS = [
    "mosquito", "disease", "sewage", "contaminated", "stagnant water",
    "machhar", "ganda paani", "मच्छर", "बीमारी", "गंदा पानी", "dengue"
]

SENSITIVE_LOCATION_TERMS = [
    "school", "hospital", "junction", "market", "children",
    "school ke paas", "hospital ke paas", "स्कूल", "अस्पताल"
]

DURATION_TERMS = [
    "since", "days", "weeks", "three days", "repeatedly",
    "din se", "hafton se", "दिनों से", "कई दिन"
]

WIDESPREAD_TERMS = [
    "entire", "whole", "all residents", "many people", "whole lane",
    "poori gali", "poora ward", "पूरा", "सभी"
]

@dataclass
class PriorityResult:
    level: str
    score: int
    reasons: List[str]

def contains_any(text: str, terms: List[str]) -> bool:
    normalized = text.lower()
    return any(term.lower() in normalized for term in terms)

def compute_priority(text: str, existing_issue_count: int = 0) -> PriorityResult:
    """
    Computes deterministic priority level, priority score (0-100), and explainable reasons.
    """
    if not text:
        return PriorityResult("low", 0, ["Empty complaint text"])

    score = 0
    reasons = []

    if contains_any(text, SAFETY_TERMS):
        score += 45
        reasons.append("Safety hazard detected (+45)")

    if contains_any(text, EMERGENCY_TERMS):
        score += 20
        reasons.append("Urgency phrase detected (+20)")

    if contains_any(text, HEALTH_TERMS):
        score += 20
        reasons.append("Public-health risk detected (+20)")

    if contains_any(text, SENSITIVE_LOCATION_TERMS):
        score += 15
        reasons.append("Sensitive public location mentioned (+15)")

    if contains_any(text, DURATION_TERMS):
        score += 10
        reasons.append("Persistent duration mentioned (+10)")

    if contains_any(text, WIDESPREAD_TERMS):
        score += 10
        reasons.append("Widespread impact mentioned (+10)")

    if existing_issue_count > 0:
        impact_bonus = min(existing_issue_count * 2, 20)
        score += impact_bonus
        reasons.append(f"Existing citizen impact: {existing_issue_count} linked reports (+{impact_bonus})")

    # Critical override for severe life safety hazards
    if contains_any(text, ["fire", "electric shock", "gas leak", "collapse", "आग", "करंट"]):
        return PriorityResult("critical", max(score, 75), reasons + ["Emergency safety override applied"])

    if score >= 71:
        level = "critical"
    elif score >= 46:
        level = "high"
    elif score >= 21:
        level = "medium"
    else:
        level = "low"

    return PriorityResult(level, min(score, 100), reasons or ["Standard civic report signal"])
