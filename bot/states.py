from aiogram.fsm.state import State, StatesGroup


class AddOrder(StatesGroup):
    order_type = State()
    fio = State()
    phone = State()
    printer = State()
    description = State()
    price = State()
    accept_date = State()
    visit_date = State()
    master = State()
    photo_url = State()
    search = State()
