from datetime import datetime
import json, os

# In production this would read from PostgreSQL
# For MVP we use a JSON file to persist zone loss data
LOSS_DATA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../data/zone_loss_history.json")

def _load_loss_data() -> dict:
    if not os.path.exists(LOSS_DATA_PATH):
        return {}
    with open(LOSS_DATA_PATH) as f:
        return json.load(f)

def _save_loss_data(data: dict):
    with open(LOSS_DATA_PATH, "w") as f:
        json.dump(data, f, indent=2)

def record_week_outcome(zone: str, city: str, expected_loss: float, actual_loss: float):
    """
    Called by Sam's engine after each claim week closes.
    Records actual vs expected loss per zone.
    """
    data = _load_loss_data()

    key = f"{city}_{zone}"
    if key not in data:
        data[key] = {
            "zone":          zone,
            "city":          city,
            "history":       [],
            "current_multiplier": 1.0
        }

    data[key]["history"].append({
        "week":          datetime.now().strftime("%Y-%W"),
        "expected_loss": expected_loss,
        "actual_loss":   actual_loss,
        "ratio":         round(actual_loss / expected_loss, 4) if expected_loss > 0 else 1.0
    })

    # Keep only last 12 weeks
    data[key]["history"] = data[key]["history"][-12:]
    _save_loss_data(data)

def recalibrate_all_zones() -> dict:
    """
    Sunday cron job — recalibrates premium multiplier for every zone.
    New multiplier = old × (actual_loss / expected_loss), capped ±15%
    """
    data    = _load_loss_data()
    results = {}

    for key, zone_data in data.items():
        history = zone_data.get("history", [])

        if not history:
            continue

        # Use last week's ratio
        last_week         = history[-1]
        expected          = last_week.get("expected_loss", 1.0)
        actual            = last_week.get("actual_loss", 1.0)

        if expected <= 0:
            continue

        ratio             = actual / expected
        old_multiplier    = zone_data.get("current_multiplier", 1.0)

        # Apply ratio but cap change at ±15%
        raw_new           = old_multiplier * ratio
        max_allowed       = old_multiplier * 1.15
        min_allowed       = old_multiplier * 0.85
        new_multiplier    = round(max(min_allowed, min(max_allowed, raw_new)), 4)

        data[key]["current_multiplier"] = new_multiplier
        data[key]["last_recalibrated"]  = datetime.now().isoformat()

        results[key] = {
            "zone":            zone_data["zone"],
            "city":            zone_data["city"],
            "old_multiplier":  round(old_multiplier, 4),
            "new_multiplier":  new_multiplier,
            "actual_loss":     actual,
            "expected_loss":   expected,
            "ratio":           round(ratio, 4),
            "direction":       "up" if new_multiplier > old_multiplier else "down",
        }

    _save_loss_data(data)

    print(f"[Recalibration] {datetime.now().isoformat()} — {len(results)} zones updated")
    return results

def get_zone_multiplier(city: str, zone: str) -> float:
    """
    Returns current recalibrated multiplier for a zone.
    Used by premium engine to adjust weekly price.
    """
    data = _load_loss_data()
    key  = f"{city}_{zone}"
    return data.get(key, {}).get("current_multiplier", 1.0)