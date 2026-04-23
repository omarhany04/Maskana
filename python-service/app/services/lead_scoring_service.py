from app.models.schemas import LeadPayload, LeadScoreResponse


def score_lead(lead: LeadPayload) -> LeadScoreResponse:
    score = 0
    reasoning: list[str] = []

    if lead.email:
        score += 10
        reasoning.append("Email address available for follow-up automation.")

    if lead.phone:
        score += 15
        reasoning.append("Phone number available for rapid contact.")

    if lead.budget and lead.budget >= 250000:
        score += 20
        reasoning.append("Budget indicates high-value buying potential.")
    elif lead.budget:
        score += 12
        reasoning.append("Budget provided and usable for matching.")

    if lead.location:
        score += 10
        reasoning.append("Preferred location narrows inventory matching.")

    if lead.property_type:
        score += 10
        reasoning.append("Property type preference is defined.")

    if lead.intent and lead.intent.lower() in {"buy", "invest"}:
        score += 15
        reasoning.append("Intent suggests near-term purchase or investment activity.")
    elif lead.intent:
        score += 8
        reasoning.append("Intent signal is present.")

    source_value = lead.source.lower()
    if source_value in {"website", "referral", "whatsapp"}:
        score += 12
        reasoning.append("Lead source historically converts well.")
    else:
        score += 6
        reasoning.append("Lead source captured for attribution.")

    status_value = lead.status.upper()
    if status_value in {"QUALIFIED", "VISIT"}:
        score += 15
        reasoning.append("Status indicates a mid-funnel or advanced opportunity.")
    elif status_value == "CONTACTED":
        score += 8
        reasoning.append("Lead has already been engaged.")

    if lead.notes and len(lead.notes.strip()) > 20:
        score += 6
        reasoning.append("Notes contain additional qualification context.")

    score = max(0, min(100, score))

    classification = "cold"
    if score >= 75:
        classification = "hot"
    elif score >= 45:
        classification = "warm"

    return LeadScoreResponse(score=score, classification=classification, reasoning=reasoning)

