const API_URL = "https://3dfixbot-production.up.railway.app";

let TOKEN = localStorage.getItem("crm_token");
let ROLE = localStorage.getItem("crm_role");
let MASTER = localStorage.getItem("crm_master");

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
    ROLE = data.role;
    MASTER = data.master;

    localStorage.setItem("crm_token", TOKEN);
    localStorage.setItem("crm_role", ROLE);

    if (MASTER) {
        localStorage.setItem("crm_master", MASTER);
    } else {
        localStorage.removeItem("crm_master");
    }

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

    const userInfo = document.getElementById("userInfo");

    if (stats.role === "admin") {
        userInfo.innerHTML = "Режим: Администратор";
    } else {
        userInfo.innerHTML = `Режим: Мастер — ${stats.master}`;
    }

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

    renderVisits();

    renderOrders();
}

function renderVisits() {

    const container = document.getElementById("visitsContainer");

    container.innerHTML = "";

    const visits = orders.filter(order =>
        order.visit_date &&
        order.visit_date !== "-" &&
        order.visit_date !== "Нет"
    );

    if (visits.length === 0) {
        container.innerHTML = `
            <div class="visit-card">
                Нет выездов
            </div>
        `;
        return;
    }

    visits.forEach(order => {

        const card = document.createElement("div");

        card.className = "visit-card";

        card.innerHTML = `
            <div class="visit-date">
                📅 ${order.visit_date}
            </div>

            <div>
                <strong>${order.fio}</strong>
            </div>

            <div>
                ${order.phone}
            </div>

            <div>
                ${order.printer}
            </div>

            <div>
                👨‍🔧 ${order.master}
            </div>

            <div>
                ${order.description}
            </div>
        `;

        container.appendChild(card);

    });
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

    if (filtered.length === 0) {
        container.innerHTML = "<p>Заказов нет</p>";
        return;
    }

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
                    <div class="label">Время выезда</div>
                    <div class="value">${order.visit_time || "-"}</div>
                </div>

                <div class="order-item">
                    <div class="label">Мастер</div>
                    <div class="value">${order.master}</div>
                </div>

            </div>
            
            ${order.photo_url ? `
                <div class="order-photo">
                    <img
                        src="${order.photo_url}"
                        alt="Фото заказа"
                        onclick="openImageModal('${order.photo_url}')"
                    >
                 </div>
            ` : ""}
            
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

                <button
                    class="btn-edit"
                    onclick="openEditModal(${order.id})">
                    ✏️ Редактировать
                </button>

                <button
                    class="btn-history"
                    onclick="showHistory(${order.id})">
                    🕘 История
                </button>

                <button
                    class="btn-delete"
                    onclick="deleteOrder(${order.id})">
                    🗑 Удалить
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
    localStorage.removeItem("crm_role");
    localStorage.removeItem("crm_master");

    location.reload();
}

document.getElementById("search").addEventListener("input", renderOrders);

document.getElementById("statusFilter").addEventListener("change", renderOrders);

if (TOKEN) {
    startCRM();
}

function openImageModal(imageUrl) {

    const modal = document.getElementById("imageModal");

    const image = document.getElementById("modalImage");

    image.src = imageUrl;

    modal.style.display = "flex";
}

function closeImageModal() {

    document.getElementById("imageModal").style.display = "none";
}

async function showHistory(orderId) {

    const response = await fetch(`${API_URL}/orders/${orderId}/history`, {
        headers: getHeaders()
    });

    const history = await response.json();

    let text = `История заказа #${orderId}\n\n`;

    if (history.length === 0) {
        text += "Истории пока нет";
    } else {
        history.forEach(item => {
            text += `${item.created_at}\n`;
            text += `${item.action}\n`;
            text += `${item.old_value} → ${item.new_value}\n`;
            text += `Кто: ${item.actor}\n\n`;
        });
    }

    alert(text);
}

async function deleteOrder(orderId) {

    const confirmed = confirm(`Удалить заказ #${orderId}?`);

    if (!confirmed) {
        return;
    }

    const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: "DELETE",
        headers: getHeaders()
    });

    if (!response.ok) {
        alert("Удалять заказы может только администратор");
        return;
    }

    await loadStats();
    await loadOrders();
}

let editingOrderId = null;

function openEditModal(orderId) {
    const order = orders.find(item => item.id === orderId);

    if (!order) {
        alert("Заказ не найден");
        return;
    }

    editingOrderId = orderId;

    document.getElementById("editOrderType").value = order.order_type;
    document.getElementById("editFio").value = order.fio;
    document.getElementById("editPhone").value = order.phone;
    document.getElementById("editPrinter").value = order.printer;
    document.getElementById("editDescription").value = order.description;
    document.getElementById("editPrice").value = order.price;
    document.getElementById("editAcceptDate").value = order.accept_date;
    document.getElementById("editVisitDate").value = order.visit_date;
    document.getElementById("editVisitTime").value = order.visit_time || "";
    document.getElementById("editMaster").value = order.master;

    document.getElementById("editModal").style.display = "flex";
}

function closeEditModal() {
    document.getElementById("editModal").style.display = "none";
}

async function saveEdit() {
    const data = {
        order_type: document.getElementById("editOrderType").value,
        fio: document.getElementById("editFio").value,
        phone: document.getElementById("editPhone").value,
        printer: document.getElementById("editPrinter").value,
        description: document.getElementById("editDescription").value,
        price: document.getElementById("editPrice").value,
        accept_date: document.getElementById("editAcceptDate").value,
        visit_date: document.getElementById("editVisitDate").value,
        visit_time: document.getElementById("editVisitTime").value,
        master: document.getElementById("editMaster").value
    };

    const response = await fetch(`${API_URL}/orders/${editingOrderId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        alert("Редактировать может только администратор");
        return;
    }

    closeEditModal();

    await loadStats();
    await loadOrders();
}
