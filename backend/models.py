from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base


Base = declarative_base()


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    order_type = Column(String)

    fio = Column(String)

    phone = Column(String)

    printer = Column(String)

    description = Column(String)

    price = Column(String)

    accept_date = Column(String)

    visit_date = Column(String)

    master = Column(String)

    status = Column(String)

    photo_url = Column(String)
