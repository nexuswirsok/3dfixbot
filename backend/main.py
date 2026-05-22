import os

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import engine, SessionLocal
from models import Base, Order
from schemas import OrderCreate, StatusUpdate, LoginRequest


API_KEY = os.getenv("API_KEY")
WEB_PASSWORD = os.getenv("WEB_PASSWORD")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
MASTER_PASSWORDS = os.getenv("MASTER_PASSWORDS", "")


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Base.metadata.create_all(bind=engine)


def parse_master_passwords():
    result = {}

    pairs = MASTER_PASSWORDS.split(";")

    for pair in pairs:
        if ":" in pair:
            name, password = pair.split(":", 1)
            result[password.strip()] = name.strip()

    return result


def get_auth_user(authorization: str | None, x_api_key: str | None):
    if x_api_key == API_KEY:
        return {
            "role": "bot",
            "master": None
        }

    if not authorization:
        raise HTTPException(status_code=401, detail="Unauthorized")

    token = authorization.replace("Bearer ", "")

    if token == API_KEY:
        return {
            "role": "admin",
            "master": None
        }

    if token.startswith("master_token:"):
        password = token.replace("master_token:", "", 1)

        masters = parse_master_passwords()

        if password in masters:
            return {
                "role": "master",
                "master": masters[password]
            }

    raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/")
async def root():
    return {
        "status": "CRM Backend Working"
    }


@app.post("/login")
async def login(data: LoginRequest):
    if ADMIN_PASSWORD and data.password == ADMIN_PASSWORD:
        return {
            "token": API_KEY,
            "role": "admin",
            "master": None
        }

    if WEB_PASSWORD and data.password == WEB_PASSWORD:
        return {
            "token": API_KEY,
            "role": "admin",
            "master": None
        }

    masters = parse_master_passwords()

    if data.password in masters:
        master_name = masters[data.password]

        return {
            "token": f"master_token:{data.password}",
            "role": "master",
            "master": master_name
        }

    raise HTTPException(
        status_code=401,
        detail="Wrong password"
    )


@app.post("/orders")
async def create_order(
    order: OrderCreate,
    x_api_key: str | None = Header(default=None)
):
    user = get_auth_user(None, x_api_key)

    if user["role"] != "bot":
        raise HTTPException(status_code=403, detail="Forbidden")

    db: Session = SessionLocal()

    new_order = Order(
        order_type=order.order_type,
        fio=order.fio,
        phone=order.phone,
        printer=order.printer,
        description=order.description,
        price=order.price,
        accept_date=order.accept_date,
        visit_date=order.visit_date,
        master=order.master,
        status=order.status
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    order_id = new_order.id

    db.close()

    return {
        "message": "Order created",
        "id": order_id
    }


@app.get("/orders")
async def get_orders(
    authorization: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None)
):
    user = get_auth_user(authorization, x_api_key)

    db: Session = SessionLocal()

    query = db.query(Order)

    if user["role"] == "master":
        query = query.filter(
            func.lower(func.trim(Order.master)) == user["master"].strip().lower()
        )

    orders = query.order_by(Order.id.desc()).all()

    result = []

    for order in orders:
        result.append({
            "id": order.id,
            "order_type": order.order_type,
            "fio": order.fio,
            "phone": order.phone,
            "printer": order.printer,
            "description": order.description,
            "price": order.price,
            "accept_date": order.accept_date,
            "visit_date": order.visit_date,
            "master": order.master,
            "status": order.status
        })

    db.close()

    return JSONResponse(
        content=result,
        media_type="application/json; charset=utf-8"
    )


@app.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: int,
    data: StatusUpdate,
    authorization: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None)
):
    user = get_auth_user(authorization, x_api_key)

    db: Session = SessionLocal()

    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        db.close()
        return {
            "error": "Order not found"
        }

    if user["role"] == "master" and order.master != user["master"]:
        db.close()
        raise HTTPException(status_code=403, detail="Forbidden")

    order.status = data.status

    db.commit()
    db.close()

    return {
        "message": "Status updated",
        "id": order_id,
        "status": data.status
    }


@app.get("/stats")
async def get_stats(
    authorization: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None)
):
    user = get_auth_user(authorization, x_api_key)

    db: Session = SessionLocal()

    query = db.query(Order)

    if user["role"] == "master":
        query = query.filter(
            func.lower(func.trim(Order.master)) == user["master"].strip().lower()
        )

    orders = query.all()

    total_orders = len(orders)
    in_repair = len([order for order in orders if order.status == "В ремонте"])
    ready = len([order for order in orders if order.status == "Готов"])
    done = len([order for order in orders if order.status == "Выдан"])

    total_money = 0
    masters = {}

    for order in orders:
        try:
            total_money += int(order.price)
        except:
            pass

        if order.master not in masters:
            masters[order.master] = {
                "orders": 0,
                "money": 0
            }

        masters[order.master]["orders"] += 1

        try:
            masters[order.master]["money"] += int(order.price)
        except:
            pass

    db.close()

    return {
        "total_orders": total_orders,
        "in_repair": in_repair,
        "ready": ready,
        "done": done,
        "total_money": total_money,
        "masters": masters,
        "role": user["role"],
        "master": user["master"]
    }
