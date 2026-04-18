import httpx
import os
from dotenv import load_dotenv

load_dotenv()

GNEWS_API_KEY = os.getenv("GNEWS_API_KEY")

CITY_KEYWORDS = {
    "mumbai": "Mumbai",
    "delhi": "Delhi",
    "lucknow": "Lucknow",
    "chennai": "Chennai",
    "bengaluru": "Bengaluru",
    "thiruvananthapuram": "Thiruvananthapuram",
}

BANDH_KEYWORDS = ["bandh", "curfew", "strike", "shutdown", "hartal"]

async def get_bandh_risk(city: str) -> dict:
    city_name = CITY_KEYWORDS.get(city, city.capitalize())

    if not GNEWS_API_KEY:
        return {"bandh": 0.20}

    try:
        # Search for bandh/curfew news in the city
        query = f"{city_name} bandh OR curfew OR strike OR shutdown"
        url = (
            f"https://gnews.io/api/v4/search"
            f"?q={query}"
            f"&lang=en"
            f"&country=in"
            f"&max=10"
            f"&apikey={GNEWS_API_KEY}"
        )

        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            data = resp.json()

        articles = data.get("articles", [])

        if not articles:
            return {"bandh": 0.15}

        # Count how many articles contain bandh keywords
        hits = 0
        for article in articles:
            title       = article.get("title", "").lower()
            description = article.get("description", "").lower()
            combined    = title + " " + description

            if any(kw in combined for kw in BANDH_KEYWORDS):
                hits += 1

        # 3+ articles = high risk, scale 0–1
        bandh_risk = min(hits / 3.0, 1.0)

        return {"bandh": round(bandh_risk, 2)}

    except Exception:
        return {"bandh": 0.20}