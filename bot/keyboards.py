from aiogram.types import ReplyKeyboardMarkup, KeyboardButton
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton


main_keyboard = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="➕ Новый заказ")],
        [KeyboardButton(text="📋 Все заказы")],
        [KeyboardButton(text="🔍 Поиск клиента")],
        [
            KeyboardButton(text="🛠 В ремонте"),
            KeyboardButton(text="✅ Готовые")
        ],
        [KeyboardButton(text="📦 Выданные")],
        [KeyboardButton(text="📊 Статистика")]
    ],
    resize_keyboard=True
)


order_type_keyboard = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="🔧 Ремонт")],
        [KeyboardButton(text="🖨 3D Печать")],
        [KeyboardButton(text="🎨 Моделирование")],
        [KeyboardButton(text="📡 Сканирование")]
    ],
    resize_keyboard=True
)


def get_status_keyboard(order_id):
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🛠 В ремонте",
                    callback_data=f"status:{order_id}:В ремонте"
                )
            ],
            [
                InlineKeyboardButton(
                    text="✅ Готов",
                    callback_data=f"status:{order_id}:Готов"
                )
            ],
            [
                InlineKeyboardButton(
                    text="📦 Выдан",
                    callback_data=f"status:{order_id}:Выдан"
                )
            ]
        ]
    )