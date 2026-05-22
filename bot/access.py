from config import ADMIN_ID, MASTER_IDS


def is_allowed_user(telegram_id: int) -> bool:
    telegram_id = str(telegram_id)

    if ADMIN_ID and telegram_id == str(ADMIN_ID):
        return True

    masters = [
        item.strip()
        for item in MASTER_IDS.split(",")
        if item.strip()
    ]

    return telegram_id in masters


def is_admin(telegram_id: int) -> bool:
    return ADMIN_ID and str(telegram_id) == str(ADMIN_ID)