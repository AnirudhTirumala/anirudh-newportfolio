"""
Powers the interactive dashboard on the JanSeva Connect project page: a
citizen-facing request form, a staff/admin queue (protected - demonstrates
the same role-based access the real project used), and a multilingual
assistant.

The assistant calls a live LLM (OpenAI-compatible Chat Completions, default
xAI Grok) when LLM_API_KEY is set. Without a key it falls back to a small
rule-based responder that still genuinely detects Hindi / Telugu / English
by Unicode script and answers common Panchayat questions - a real, working
demo rather than a placeholder.
"""

import random
import string
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..config import settings
from ..database import get_db
from ..security import get_current_admin, rate_limiter

router = APIRouter(prefix="/api/janseva", tags=["janseva"])

# Public, unauthenticated-by-design endpoints (citizens use these with no
# login) are still capped per-IP so they can't be used to run up an LLM
# bill or flood the database.
_chat_rate_limit = rate_limiter("janseva_chat", max_requests=20, window_seconds=600)
_request_rate_limit = rate_limiter("janseva_request", max_requests=20, window_seconds=600)

_HINDI_RANGE = range(0x0900, 0x0980)
_TELUGU_RANGE = range(0x0C00, 0x0C80)

_DEMO_REPLIES = {
    "en": {
        "certificate": (
            "Birth, death, and income certificates can be requested from the Citizen Services tab - "
            "submit a request with your name and village, and Panchayat staff will process it within "
            "a few working days."
        ),
        "water": (
            'For a new water connection or a billing query, submit a request under "Water Supply" '
            "with your address, and the ward staff will follow up."
        ),
        "tax": (
            'Property tax payments and receipts are handled by the Panchayat office - submit a '
            'request under "Tax & Revenue" with your property ID if you have one.'
        ),
        "grievance": (
            "You're welcome to file a grievance any time - describe the issue and your village, and "
            "it'll show up in the staff queue for review."
        ),
        "default": (
            "I can help with certificates, water supply, property tax, and grievances. Try submitting "
            "a service request from the Citizen Services tab, or ask me something more specific."
        ),
    },
    "hi": {
        "certificate": (
            "जन्म, मृत्यु और आय प्रमाण पत्र के लिए Citizen Services टैब से अनुरोध सबमिट करें - अपना नाम और गाँव "
            "बताएं, पंचायत स्टाफ कुछ कार्य दिवसों में इसे पूरा करेगा।"
        ),
        "water": (
            'नए पानी कनेक्शन या बिल से जुड़े सवाल के लिए "Water Supply" के अंतर्गत अनुरोध सबमिट करें, '
            "वार्ड स्टाफ आपसे संपर्क करेगा।"
        ),
        "tax": 'संपत्ति कर से जुड़े भुगतान और रसीद के लिए "Tax & Revenue" के अंतर्गत अनुरोध सबमिट करें।',
        "grievance": (
            "आप कभी भी शिकायत दर्ज कर सकते हैं - समस्या और अपने गाँव का विवरण देकर अनुरोध सबमिट करें, यह "
            "स्टाफ की सूची में दिख जाएगा।"
        ),
        "default": (
            "मैं प्रमाण पत्र, जल आपूर्ति, संपत्ति कर और शिकायतों में मदद कर सकता हूँ। Citizen Services टैब से "
            "अनुरोध सबमिट करके देखें।"
        ),
    },
    "te": {
        "certificate": (
            "జనన, మరణ మరియు ఆదాయ ధృవీకరణ పత్రాల కోసం Citizen Services టాబ్ నుండి అభ్యర్థన సమర్పించండి - మీ "
            "పేరు, గ్రామం ఇవ్వండి, పంచాయతీ సిబ్బంది కొన్ని పనిదినాల్లో పూర్తి చేస్తారు."
        ),
        "water": (
            'కొత్త నీటి కనెక్షన్ లేదా బిల్లు సందేహాల కోసం "Water Supply" కింద అభ్యర్థన సమర్పించండి, వార్డు '
            "సిబ్బంది సంప్రదిస్తారు."
        ),
        "tax": 'ఆస్తి పన్ను చెల్లింపులు, రసీదుల కోసం "Tax & Revenue" కింద అభ్యర్థన సమర్పించండి.',
        "grievance": "మీరు ఎప్పుడైనా ఫిర్యాదు నమోదు చేసుకోవచ్చు - సమస్యను, మీ గ్రామాన్ని వివరిస్తూ అభ్యర్థన సమర్పించండి.",
        "default": (
            "నేను ధృవీకరణ పత్రాలు, నీటి సరఫరా, ఆస్తి పన్ను, ఫిర్యాదుల్లో సహాయం చేయగలను. Citizen Services టాబ్ "
            "నుండి అభ్యర్థన సమర్పించి చూడండి."
        ),
    },
}

_KEYWORDS = {
    "certificate": ["certificate", "birth", "death", "income proof", "जन्म", "मृत्यु", "प्रमाण", "ధృవీ", "జనన", "మరణ"],
    "water": ["water", "पानी", "जल", "నీరు", "నీటి"],
    "tax": ["tax", "कर", "పన్ను", "revenue", "property"],
    "grievance": ["grievance", "complaint", "शिकायत", "ఫిర్యాదు", "problem", "issue"],
}


def _detect_language(text: str) -> str:
    for ch in text:
        code = ord(ch)
        if code in _HINDI_RANGE:
            return "hi"
        if code in _TELUGU_RANGE:
            return "te"
    return "en"


def _match_topic(message: str) -> str:
    lowered = message.lower()
    for topic, words in _KEYWORDS.items():
        if any(word.lower() in lowered for word in words):
            return topic
    return "default"


def _generate_reference_code() -> str:
    year = datetime.now(timezone.utc).year
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"JSC-{year}-{suffix}"


def _demo_chat_reply(message: str, language_hint: str) -> schemas.ChatMessageOut:
    detected = _detect_language(message) if language_hint == "auto" else language_hint
    detected = detected if detected in _DEMO_REPLIES else "en"
    topic = _match_topic(message)
    return schemas.ChatMessageOut(reply=_DEMO_REPLIES[detected][topic], detected_language=detected, is_demo=True)


async def _live_chat_reply(message: str, language_hint: str) -> schemas.ChatMessageOut:
    detected = _detect_language(message) if language_hint == "auto" else language_hint
    system_prompt = (
        "You are the JanSeva Connect assistant, a multilingual helper for a Gram Panchayat "
        "(village-level local government) portal in India. Answer citizen questions about local "
        "government services - certificates, water supply, property tax, grievances - simply and "
        "practically, in the same language the citizen wrote in. If you don't know a specific local "
        "policy, say so honestly and suggest they submit a service request or contact the Panchayat "
        "office directly. Keep answers under 80 words."
    )
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                f"{settings.LLM_API_BASE.rstrip('/')}/chat/completions",
                headers={"Authorization": f"Bearer {settings.LLM_API_KEY}"},
                json={
                    "model": settings.LLM_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": message},
                    ],
                    "temperature": 0.4,
                    "max_tokens": 220,
                },
            )
            response.raise_for_status()
            data = response.json()
            reply = data["choices"][0]["message"]["content"].strip()
            return schemas.ChatMessageOut(reply=reply, detected_language=detected, is_demo=False)
    except Exception:
        # A flaky upstream call should never break the dashboard - fall back to the demo responder.
        return _demo_chat_reply(message, language_hint)


@router.get("/requests", response_model=list[schemas.ServiceRequestOut])
def list_requests(
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> list[models.ServiceRequest]:
    """Admin-only: this returns every citizen's name, village, and issue
    description. It must never be reachable without a valid admin token -
    that would leak real people's personal information to anyone who found
    the URL."""
    return db.query(models.ServiceRequest).order_by(models.ServiceRequest.created_at.desc()).limit(50).all()


@router.post(
    "/requests",
    response_model=schemas.ServiceRequestOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(_request_rate_limit)],
)
def create_request(
    payload: schemas.ServiceRequestCreate,
    db: Session = Depends(get_db),
) -> models.ServiceRequest:
    code = ""
    for _ in range(5):
        candidate = _generate_reference_code()
        clash = db.query(models.ServiceRequest).filter(models.ServiceRequest.reference_code == candidate).first()
        if not clash:
            code = candidate
            break
    if not code:
        raise HTTPException(status_code=500, detail="Could not generate a reference code, please try again")

    entry = models.ServiceRequest(reference_code=code, **payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.put("/requests/{request_id}/status", response_model=schemas.ServiceRequestOut)
def update_status(
    request_id: int,
    payload: schemas.ServiceRequestStatusUpdate,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
) -> models.ServiceRequest:
    entry = db.get(models.ServiceRequest, request_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if payload.status not in {"submitted", "in_review", "resolved"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="status must be submitted, in_review, or resolved")
    entry.status = payload.status
    db.commit()
    db.refresh(entry)
    return entry


@router.post("/chat", response_model=schemas.ChatMessageOut, dependencies=[Depends(_chat_rate_limit)])
async def chat(payload: schemas.ChatMessageIn) -> schemas.ChatMessageOut:
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty")
    if settings.LLM_API_KEY:
        return await _live_chat_reply(message, payload.language)
    return _demo_chat_reply(message, payload.language)
