import requests

from config import BACKEND_URL, API_KEY


HEADERS = {
    "X-API-Key": API_KEY
}


def create_order(data):
    response = requests.post(
        f"{BACKEND_URL}/orders",
        json=data,
        headers=HEADERS,
        timeout=15
    )

    return response.json()


def get_orders():
    response = requests.get(
        f"{BACKEND_URL}/orders",
        headers=HEADERS,
        timeout=15
    )

    return response.json()


def update_status(order_id, status):
    response = requests.put(
        f"{BACKEND_URL}/orders/{order_id}/status",
        json={
            "status": status
        },
        headers=HEADERS,
        timeout=15
    )

    return response.json()


def get_stats():
    response = requests.get(
        f"{BACKEND_URL}/stats",
        headers=HEADERS,
        timeout=15
    )

    return response.json()
