import uuid

def simulate_upi_payout(
    user_id: str,
    amount: float,
    reason: str,
    upi_id: str = "rider@upi"
) -> dict:
    """
    Simulated UPI payout.
    In production, actual payout is handled by backend (Neema) using Razorpay.
    This function exists only for ML engine demo/testing.
    """

    return {
        "status": "success",
        "payout_id": f"SIM_{uuid.uuid4().hex[:8].upper()}",
        "user_id": user_id,
        "amount": amount,
        "upi_id": upi_id,
        "reason": reason,
        "message": f"₹{amount:.0f} credited to your UPI. Stay safe.",
        "razorpay_status": "simulated"
    }