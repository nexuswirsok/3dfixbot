from pydantic import BaseModel


class OrderCreate(BaseModel):
    order_type: str
    fio: str
    phone: str
    printer: str
    description: str
    price: str
    accept_date: str
    visit_date: str
    master: str
    status: str = "Принят"
    photo_url: str | None = None


class StatusUpdate(BaseModel):
    status: str


class LoginRequest(BaseModel):
    password: str
