import os

from dotenv import load_dotenv


load_dotenv()


TOKEN = os.getenv("TOKEN")

BACKEND_URL = os.getenv("BACKEND_URL")

ADMIN_ID = os.getenv("ADMIN_ID")

MASTER_IDS = os.getenv("MASTER_IDS", "")