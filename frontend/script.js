const API_URL = "https://3dfixbot-production.up.railway.app";

let TOKEN = localStorage.getItem("crm_token");

let orders = [];

function getHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN}`
    };
}

async function login() {

    const password = document.getElementById("password").value;

    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            password: password
        })
    });

    if (!response.ok) {
        alert("Неверный пароль");
        return;
    }

    const data = await response.json();

    TOKEN = data.token;

    localStorage.setItem("crm_token", TOKEN);

    startCRM();
}

async function loadStats() {

    const response = await fetch(`${API_URL}/stats`, {
        headers: getHeaders()
    });

    if (response.status === 401) {
        logout();
        return;
    }

    const stats = await response.json();

    document.getElementById("totalOrders").innerText = stats.total_orders;
    document.getElementById("inRepair").innerText = stats.in_repair;
    document.getElementById("readyOrders").innerText = stats.ready;
    document.getElementById("doneOrders").innerText = stats.done;
    document.getElementById("totalRevenue").innerText = `${stats.total_money} ₽`;

    const mastersContainer = document.getElementById("mastersKpi");

    mastersContainer.innerHTML = "";

    const masters = stats.masters || {};

    Object.keys(masters).forEach(master => {

        const item = document.createElement("div");

        item.className = "master-card";

        item.innerHTML = `
            <div class="master-name">${master}</div>
            <div>Заказов: ${masters[master].orders}</div>
            <div>Выручка: ${masters[master].money} ₽</div>
        `;

        mastersContainer.appendChild(item);

    });
}

async function loadOrders() {

    const response = await fetch(`${API_URL}/orders`, {
        headers: getHeaders()
    });

    if (response.status === 401) {
        logout();
        return;
    }

    orders = await response.json();

    renderOrders();
}

async function updateStatus(orderId, status) {

    await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
            status: status
        })
    });

    await loadStats();
    await loadOrders();
}

function renderOrders() {

    const search = document.getElementById("search").value.toLowerCase();

    const filter = document.getElementById("statusFilter").value;

    const container = document.getElementById("orders");

    container.innerHTML = "";

    const filtered = orders.filter(order => {

        const matchesSearch =
            order.fio.toLowerCase().includes(search) ||
            order.phone.includes(search);

        const matchesStatus =
            filter === "all" || order.status === filter;

        return matchesSearch && matchesStatus;
    });

    filtered.forEach(order => {

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

                <button
                    class="btn-progress"
                    onclick="updateStatus(${order.id}, 'В ремонте')">
                    🛠 В ремонт
                </button>

                <button
                    class="btn-ready"
                    onclick="updateStatus(${order.id}, 'Готов')">
                    ✅ Готов
                </button>

                <button
                    class="btn-done"
                    onclick="updateStatus(${order.id}, 'Выдан')">
                    📦 Выдан
                </button>

            </div>
        `;

        container.appendChild(card);
    });
}

function startCRM() {

    document.getElementById("loginPage").style.display = "none";

    document.getElementById("crmPage").style.display = "block";

    loadStats();

    loadOrders();

    setInterval(() => {
        loadStats();
        loadOrders();
    }, 5000);
}

function logout() {

    localStorage.removeItem("crm_token");

    location.reload();
}

document.getElementById("search").addEventListener("input", renderOrders);

document.getElementById("statusFilter").addEventListener("change", renderOrders);

if (TOKEN) {
    startCRM();
}
