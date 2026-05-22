import os
import requests

from dotenv import load_dotenv


load_dotenv()


BACKEND_URL = os.getenv("BACKEND_URL")
API_KEY = os.getenv("API_KEY")


if not BACKEND_URL:
    raise RuntimeError("BACKEND_URL is not set")

if not API_KEY:
    raise RuntimeError("API_KEY is not set")


url = f"{BACKEND_URL}/notify-visits"

response = requests.get(
    url,
    params={
        "key": API_KEY
    },
    timeout=30
)

print(response.status_code)
print(response.text)
