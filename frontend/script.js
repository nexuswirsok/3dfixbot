const API_URL = "https://3dfixbot-production.up.railway.app";

async function loadOrders() {
    const response = await fetch(`${API_URL}/orders`);
    const orders = await response.json();

    const container = document.getElementById("orders");
    container.innerHTML = "";

    const search = document.getElementById("search").value.toLowerCase();
    const filter = document.getElementById("statusFilter").value;

    let total = 0;

    orders.forEach(order => {
        total += Number(order.price || 0);

        if (
            search &&
            !order.fio.toLowerCase().includes(search) &&
            !order.phone.includes(search)
        ) {
            return;
        }

        if (filter !== "all" && order.status !== filter) {
            return;
        }

        let statusClass = "status-new";

        if (order.status === "В ремонте") {
            statusClass = "status-progress";
        }

        if (order.status === "Готов") {
            statusClass = "status-ready";
        }

        if (order.status === "Выдан") {
            statusClass = "status-done";
        }

        const card = document.createElement("div");
        card.className = "order-card";

        card.innerHTML = `
            <div class="order-header">
                <div class="order-id">
                    Заказ #${order.id}
                </div>

                <div class="status ${statusClass}">
                    ${order.status}
                </div>
            </div>

            <div class="order-grid">

                <div class="order-item">
                    <div class="label">Тип заказа</div>
                    <div class="value">${order.order_type}</div>
                </div>

                <div class="order-item">
                    <div class="label">Клиент</div>
                    <div class="value">${order.fio}</div>
                </div>

                <div class="order-item">
                    <div class="label">Телефон</div>
                    <div class="value">${order.phone}</div>
                </div>

                <div class="order-item">
                    <div class="label">Устройство</div>
                    <div class="value">${order.printer}</div>
                </div>

                <div class="order-item">
                    <div class="label">Описание</div>
                    <div class="value">${order.description}</div>
                </div>

                <div class="order-item">
                    <div class="label">Стоимость</div>
                    <div class="value">${order.price} ₽</div>
                </div>

                <div class="order-item">
                    <div class="label">Дата приёма</div>
                    <div class="value">${order.accept_date}</div>
                </div>

                <div class="order-item">
                    <div class="label">Дата выезда</div>
                    <div class="value">${order.visit_date}</div>
                </div>

                <div class="order-item">
                    <div class="label">Мастер</div>
                    <div class="value">${order.master}</div>
                </div>

            </div>

            <div class="actions">
                <button class="btn-progress"
                    onclick="updateStatus(${order.id}, 'В ремонте')">
                    🛠 В ремонт
                </button>

                <button class="btn-ready"
                    onclick="updateStatus(${order.id}, 'Готов')">
                    ✅ Готов
                </button>

                <button class="btn-done"
                    onclick="updateStatus(${order.id}, 'Выдан')">
                    📦 Выдан
                </button>
            </div>
        `;

        container.appendChild(card);
    });

    document.getElementById("totalRevenue").innerText = `${total} ₽`;
    document.getElementById("totalOrders").innerText = orders.length;
}

async function updateStatus(orderId, status) {
    await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            status: status
        })
    });

    loadOrders();
}

loadOrders();

setInterval(loadOrders, 5000);