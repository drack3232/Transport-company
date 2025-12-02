function showSection(id) {
    document.querySelectorAll('.section').forEach(div => div.style.display = 'none');
    const activeSection = document.getElementById(id);
    if (activeSection) activeSection.style.display = 'block';
}

async function sendData(url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            alert('✅ Успішно збережено!');
            document.querySelectorAll('input').forEach(input => {
                if(input.type !== 'date') input.value = ''; 
            });
        } else {
            const err = await response.json();
            alert('❌ Помилка: ' + (err.error || 'Невідома помилка'));
        }
    } catch (error) { alert('❌ Помилка з\'єднання'); }
}

document.addEventListener('DOMContentLoaded', () => {
    const forms = {
        'clientForm': '/clients',
        'driverForm': '/drivers',
        'vehicleForm': '/vehicles',
        'orderForm': '/orders',
        'tripForm': '/trips',
        'logForm': '/logs' 
    };

    for (const [id, url] of Object.entries(forms)) {
        const form = document.getElementById(id);
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = {};
                
                if(id === 'clientForm') {
                    formData.name = document.getElementById('c_name').value;
                    formData.clientType = document.getElementById('c_type').value;
                    formData.contactInfo = document.getElementById('c_contact').value;
                } else if(id === 'driverForm') {
                    formData.fullName = document.getElementById('d_name').value;
                    formData.licenseNumber = document.getElementById('d_license').value;
                    formData.contactInfo = document.getElementById('d_contact').value;
                } else if(id === 'vehicleForm') {
                    formData.regNumber = document.getElementById('v_reg').value;
                    formData.vehicleType = document.getElementById('v_type').value;
                    formData.specs = document.getElementById('v_specs').value;
                } else if(id === 'orderForm') {
                    formData.clientId = document.getElementById('o_client_id').value;
                    formData.routeDescription = document.getElementById('o_route').value;
                    formData.scheduledDeparture = document.getElementById('o_dep').value;
                    formData.scheduledArrival = document.getElementById('o_arr').value;
                } else if(id === 'tripForm') {
                    formData.orderId = document.getElementById('t_order_id').value;
                    formData.driverId = document.getElementById('t_driver_id').value;
                    formData.vehicleId = document.getElementById('t_vehicle_id').value;
                    formData.status = document.getElementById('t_status').value;
                    formData.expenses = document.getElementById('t_expenses').value;
                } else if(id === 'logForm') { 
                    formData.tripId = document.getElementById('l_trip_id').value;
                    formData.eventType = document.getElementById('l_type').value;
                    formData.comment = document.getElementById('l_comment').value;
                }
                sendData(url, formData);
            });
        }
    }
});

async function getAllDrivers() {
    try {
        const res = await fetch('/drivers');
        const data = await res.json();
        renderTable('Водії', data, ['id', 'full_name', 'license_number', 'contact_info'], 'drivers');
    } catch (e) { console.error(e); }
}

async function getAllVehicles() {
    try {
        const res = await fetch('/vehicles');
        const data = await res.json();
        renderTable('Транспорт', data, ['id', 'reg_number', 'vehicle_type', 'specs'], 'vehicles');
    } catch (e) { console.error(e); }
}

async function getAllTrips() {
    try {
        const res = await fetch('/trips');
        const data = await res.json();
        renderTable('Поїздки', data, ['id', 'status', 'full_name', 'reg_number', 'route_description'], 'trips');
    } catch (e) { console.error(e); }
}

async function getTripLogs() {
    const id = document.getElementById('view_logs_id').value;
    if(!id) return alert('Введіть ID поїздки!');

    try {
        const res = await fetch(`/logs/${id}`);
        const data = await res.json();
        showSection('reports');
        renderTable(`Журнал поїздки #${id}`, data, ['real_time', 'event_type', 'comment'], 'logs_view');
    } catch (e) { alert('Помилка отримання журналу'); }
}

async function filterOrders() {
    const start = document.getElementById('filter_start').value;
    const end = document.getElementById('filter_end').value;
    if(!start || !end) return alert('Оберіть обидві дати!');

    try {
        const res = await fetch(`/orders/filter?start=${start}&end=${end}`);
        const data = await res.json();
        renderTable(`Замовлення (${start} - ${end})`, data, ['id', 'route_description', 'scheduled_departure'], 'orders_view');
    } catch (e) { alert('Помилка пошуку'); }
}

function renderTable(title, data, columns, type) {
    const listTitle = document.getElementById('listTitle');
    const outputArea = document.getElementById('outputArea');
    const count = data.length;

    listTitle.innerHTML = `<i class="fas fa-list"></i> ${title} <span style="background:#e5e7eb; padding:2px 8px; border-radius:10px; font-size:12px;">${count}</span>`;
    
    if (count === 0) {
        outputArea.innerHTML = '<div style="text-align:center; padding:20px; color:#9ca3af;">Список порожній</div>';
        return;
    }

    let html = '<table><thead><tr>';
    
    columns.forEach(col => {
        let name = col === 'id' ? '№' : col.toUpperCase().replace('_', ' ');
        html += `<th>${name}</th>`;
    });
    
    if(type !== 'logs_view' && type !== 'orders_view') {
        html += '<th style="text-align:center">ДІЇ</th>';
    }
    html += '</tr></thead><tbody>';

    data.forEach((item, index) => {
        html += '<tr>';
        columns.forEach(col => {
            let val = item[col] || '-';

            if (col === 'id') val = index + 1;

            if (col.includes('time') || col.includes('departure')) {
                val = new Date(val).toLocaleString();
            }

            if (col === 'status') {
                let badgeClass = 'status-scheduled';
                if(val === 'In Progress') badgeClass = 'status-inprogress';
                if(val === 'Completed') badgeClass = 'status-completed';
                val = `<span class="status-badge ${badgeClass}">${val}</span>`;
            }
            html += `<td>${val}</td>`;
        });
        
        if(type !== 'logs_view' && type !== 'orders_view') {
            html += `<td style="text-align:center;">
                <button class="delete-btn" onclick="deleteItem('${type}', ${item.id})"><i class="fas fa-trash"></i></button>
            </td>`;
        }
        html += '</tr>';
    });

    html += '</tbody></table>';
    outputArea.innerHTML = html;
}

async function deleteItem(endpoint, id) {
    if(!confirm('Видалити?')) return;
    try {
        await fetch(`/${endpoint}/${id}`, { method: 'DELETE' });
        if(endpoint === 'drivers') getAllDrivers();
        if(endpoint === 'vehicles') getAllVehicles();
        if(endpoint === 'trips') getAllTrips();
    } catch (e) { alert('Помилка видалення'); }
}