import razorpay
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

KEY_ID     = os.getenv("RAZORPAY_KEY_ID")
KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

# Initialize Razorpay client
client = razorpay.Client(auth=(KEY_ID, KEY_SECRET))

def simulate_upi_payout(
    user_id: str,
    amount: float,
    reason: str,
    upi_id: str = "rider@upi"   # mock UPI id for demo
) -> dict:
    """
    Simulates a UPI payout via Razorpay sandbox.
    In production this would be a real transfer.
    Amount is in rupees — we convert to paise internally.
    """

    amount_paise = int(amount * 100)  # Razorpay works in paise

    try:
        # Create a Razorpay payout (sandbox mode)
        payout = client.payout.create({
            "account_number": "2323230072195682",  # sandbox account
            "fund_account": {
                "account_type": "vpa",
                "vpa": {
                    "address": upi_id
                },
                "contact": {
                    "name":    user_id,
                    "type":    "customer",
                    "contact": "9999999999",
                    "email":   f"{user_id}@gigshield.in"
                }
            },
            "amount":      amount_paise,
            "currency":    "INR",
            "mode":        "UPI",
            "purpose":     "payout",
            "queue_if_low_balance": True,
            "reference_id": str(uuid.uuid4()),
            "narration":   reason,
        })

        return {
            "status":       "success",
            "payout_id":    payout.get("id", "demo_payout_001"),
            "amount":       amount,
            "upi_id":       upi_id,
            "message":      f"₹{amount:.0f} credited to your UPI. Stay safe.",
            "razorpay_status": payout.get("status", "processed"),
        }

    except Exception as e:
        # Razorpay sandbox sometimes rejects — fall back to simulation
        return {
            "status":    "simulated",
            "payout_id": f"SIM_{uuid.uuid4().hex[:8].upper()}",
            "amount":    amount,
            "upi_id":    upi_id,
            "message":   f"₹{amount:.0f} credited to your UPI. Stay safe.",
            "razorpay_status": "simulated",
        }