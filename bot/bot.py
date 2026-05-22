import asyncio

from aiogram import Bot, Dispatcher, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery
from aiogram.fsm.context import FSMContext

from config import TOKEN
from access import is_allowed_user, is_admin
from states import AddOrder
from keyboards import main_keyboard, order_type_keyboard, get_status_keyboard

import api


bot = Bot(token=TOKEN)

dp = Dispatcher()


def format_order(order: dict) -> str:
    return (
        f"ID: {order['id']}\n"
        f"Тип: {order['order_type']}\n"
        f"ФИО: {order['fio']}\n"
        f"Телефон: {order['phone']}\n"
        f"Принтер / оборудование: {order['printer']}\n"
        f"Описание: {order['description']}\n"
        f"Стоимость: {order['price']} ₽\n"
        f"Дата принятия: {order['accept_date']}\n"
        f"Дата выезда: {order['visit_date']}\n"
        f"Мастер: {order['master']}\n"
        f"Статус: {order['status']}"
    )


@dp.message(Command("start"))
async def start(message: Message, state: FSMContext):
    await state.clear()

    if not is_allowed_user(message.from_user.id):
        await message.answer("У вас нет доступа к CRM")
        return

    await message.answer(
        "Добро пожаловать в CRM 3D FIX LAB",
        reply_markup=main_keyboard
    )


@dp.message(Command("cancel"))
async def cancel(message: Message, state: FSMContext):
    await state.clear()

    await message.answer(
        "Действие отменено",
        reply_markup=main_keyboard
    )


@dp.message(Command("myid"))
async def my_id(message: Message):
    await message.answer(
        f"Ваш Telegram ID:\n{message.from_user.id}"
    )


@dp.message(F.text == "➕ Новый заказ")
async def new_order(message: Message, state: FSMContext):
    if not is_allowed_user(message.from_user.id):
        await message.answer("Нет доступа")
        return

    await state.clear()

    await message.answer(
        "Выберите тип заказа",
        reply_markup=order_type_keyboard
    )

    await state.set_state(AddOrder.order_type)


@dp.message(AddOrder.order_type)
async def get_order_type(message: Message, state: FSMContext):
    await state.update_data(
        order_type=message.text
    )

    await message.answer("Введите ФИО клиента")

    await state.set_state(AddOrder.fio)


@dp.message(AddOrder.fio)
async def get_fio(message: Message, state: FSMContext):
    await state.update_data(
        fio=message.text
    )

    await message.answer("Введите номер телефона")

    await state.set_state(AddOrder.phone)


@dp.message(AddOrder.phone)
async def get_phone(message: Message, state: FSMContext):
    await state.update_data(
        phone=message.text
    )

    await message.answer("Введите модель принтера / оборудование")

    await state.set_state(AddOrder.printer)


@dp.message(AddOrder.printer)
async def get_printer(message: Message, state: FSMContext):
    await state.update_data(
        printer=message.text
    )

    await message.answer("Опишите задачу")

    await state.set_state(AddOrder.description)


@dp.message(AddOrder.description)
async def get_description(message: Message, state: FSMContext):
    await state.update_data(
        description=message.text
    )

    await message.answer("Введите стоимость")

    await state.set_state(AddOrder.price)


@dp.message(AddOrder.price)
async def get_price(message: Message, state: FSMContext):
    await state.update_data(
        price=message.text
    )

    await message.answer("Введите дату принятия")

    await state.set_state(AddOrder.accept_date)


@dp.message(AddOrder.accept_date)
async def get_accept_date(message: Message, state: FSMContext):
    await state.update_data(
        accept_date=message.text
    )

    await message.answer(
        "Введите дату выезда\n\nЕсли выезд не нужен — напишите: Нет"
    )

    await state.set_state(AddOrder.visit_date)


@dp.message(AddOrder.visit_date)
async def get_visit_date(message: Message, state: FSMContext):
    await state.update_data(
        visit_date=message.text
    )

    await message.answer("Введите имя мастера")

    await state.set_state(AddOrder.master)


@dp.message(AddOrder.master)
async def get_master(message: Message, state: FSMContext):
    await state.update_data(
        master=message.text,
        status="Принят"
    )

    await message.answer(
        "Вставьте ссылку на фото или напишите: Нет"
    )

    await state.set_state(AddOrder.photo_url)

@dp.message(AddOrder.photo_url)
async def get_photo_url(message: Message, state: FSMContext):
    photo_url = None

    if message.text.lower() != "нет":
        photo_url = message.text

    await state.update_data(
        photo_url=photo_url
    )

    data = await state.get_data()

    result = api.create_order(data)

    if "id" not in result:
        await message.answer("Ошибка создания заказа. Проверь backend.")
        await state.clear()
        return

    await message.answer(
        f"Заказ создан\nID: {result['id']}",
        reply_markup=main_keyboard
    )

    await state.clear()


@dp.message(F.text == "📋 Все заказы")
async def all_orders(message: Message, state: FSMContext):
    await state.clear()

    if not is_allowed_user(message.from_user.id):
        await message.answer("Нет доступа")
        return

    orders = api.get_orders()

    if not orders:
        await message.answer("Заказов нет")
        return

    for order in orders:
        await message.answer(
            format_order(order),
            reply_markup=get_status_keyboard(order["id"])
        )


@dp.message(F.text == "🔍 Поиск клиента")
async def search_client(message: Message, state: FSMContext):
    if not is_allowed_user(message.from_user.id):
        await message.answer("Нет доступа")
        return

    await state.clear()

    await message.answer("Введите номер телефона")

    await state.set_state(AddOrder.search)


@dp.message(AddOrder.search)
async def process_search(message: Message, state: FSMContext):
    orders = api.get_orders()

    found_orders = [
        order for order in orders
        if order["phone"] == message.text
    ]

    if not found_orders:
        await message.answer("Клиент не найден")
        await state.clear()
        return

    for order in found_orders:
        await message.answer(
            format_order(order),
            reply_markup=get_status_keyboard(order["id"])
        )

    await state.clear()


@dp.message(F.text == "🛠 В ремонте")
async def filter_repair(message: Message, state: FSMContext):
    await state.clear()
    await show_filtered_orders(message, "В ремонте")


@dp.message(F.text == "✅ Готовые")
async def filter_ready(message: Message, state: FSMContext):
    await state.clear()
    await show_filtered_orders(message, "Готов")


@dp.message(F.text == "📦 Выданные")
async def filter_done(message: Message, state: FSMContext):
    await state.clear()
    await show_filtered_orders(message, "Выдан")


async def show_filtered_orders(message: Message, status: str):
    if not is_allowed_user(message.from_user.id):
        await message.answer("Нет доступа")
        return

    orders = api.get_orders()

    filtered_orders = [
        order for order in orders
        if order["status"] == status
    ]

    if not filtered_orders:
        await message.answer("Ничего не найдено")
        return

    for order in filtered_orders:
        await message.answer(
            format_order(order),
            reply_markup=get_status_keyboard(order["id"])
        )


@dp.message(F.text == "📊 Статистика")
async def show_stats(message: Message, state: FSMContext):
    await state.clear()

    if not is_allowed_user(message.from_user.id):
        await message.answer("Нет доступа")
        return

    stats = api.get_stats()

    text = (
        "📊 Статистика мастерской\n\n"
        f"Всего заказов: {stats['total_orders']}\n"
        f"В ремонте: {stats['in_repair']}\n"
        f"Готово: {stats['ready']}\n"
        f"Выдано: {stats['done']}\n\n"
        f"Общая выручка: {stats['total_money']} ₽\n\n"
        "KPI мастеров:\n"
    )

    masters = stats.get("masters", {})

    if not masters:
        text += "Нет данных"
    else:
        for master, data in masters.items():
            text += (
                f"\n{master}: "
                f"{data['orders']} заказов, "
                f"{data['money']} ₽"
            )

    await message.answer(text)


@dp.callback_query(F.data.startswith("status:"))
async def change_status(callback: CallbackQuery):
    parts = callback.data.split(":")

    order_id = parts[1]

    status = parts[2]

    api.update_status(order_id, status)

    await callback.message.answer(
        f"Заказ #{order_id} → {status}"
    )

    await callback.answer()


async def main():
    print("CRM BOT STARTED")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
