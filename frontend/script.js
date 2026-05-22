const API_URL = "https://ТВОЙ_BACKEND_URL";

let orders = [];

async function loadStats() {
    const response = await fetch(`${API_URL}/stats`);
    const stats = await response.json();

    const container = document.getElementById("stats");

    container.innerHTML = `
        <p><b>Всего заказов:</b> ${stats.total_orders}</p>
        <p><b>В ремонте:</b> ${stats.in_repair}</p>
        <p><b>Готово:</b> ${stats.ready}</p>
        <p><b>Выдано:</b> ${stats.done}</p>
        <p><b>Выручка:</b> ${stats.total_money} ₽</p>
    `;
}

async function loadOrders() {
    const response = await fetch(`${API_URL}/orders`);
    orders = await response.json();
    renderOrders();
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

    await loadOrders();
    await loadStats();
}

function renderOrders() {
    const search = document.getElementById("searchInput").value.toLowerCase();
    const status = document.getElementById("statusFilter").value;

    const container = document.getElementById("orders");
    container.innerHTML = "";

    const filtered = orders.filter(order => {
        const matchesSearch =
            order.fio.toLowerCase().includes(search) ||
            order.phone.toLowerCase().includes(search);

        const matchesStatus =
            status === "" || order.status === status;

        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        container.innerHTML = "<p>Заказов нет</p>";
        return;
    }

    filtered.forEach(order => {
        const div = document.createElement("div");
        div.className = "order";

        div.innerHTML = `
            <h3>Заказ #${order.id}</h3>
            <p><b>Тип:</b> ${order.order_type}</p>
            <p><b>Клиент:</b> ${order.fio}</p>
            <p><b>Телефон:</b> ${order.phone}</p>
            <p><b>Принтер:</b> ${order.printer}</p>
            <p><b>Описание:</b> ${order.description}</p>
            <p><b>Стоимость:</b> ${order.price} ₽</p>
            <p><b>Дата принятия:</b> ${order.accept_date}</p>
            <p><b>Дата выезда:</b> ${order.visit_date}</p>
            <p><b>Мастер:</b> ${order.master}</p>
            <p class="status">Статус: ${order.status}</p>

            <div class="buttons">
                <button onclick="updateStatus(${order.id}, 'В ремонте')">🛠 В ремонте</button>
                <button onclick="updateStatus(${order.id}, 'Готов')">✅ Готов</button>
                <button onclick="updateStatus(${order.id}, 'Выдан')">📦 Выдан</button>
            </div>
        `;

        container.appendChild(div);
    });
}

document.getElementById("searchInput").addEventListener("input", renderOrders);
document.getElementById("statusFilter").addEventListener("change", renderOrders);

loadStats();
loadOrders();