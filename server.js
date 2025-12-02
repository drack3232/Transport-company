const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password', 
    database: 'transport_company',
});

app.post('/clients', async (req, res) => {
    try {
        const { name, clientType, contactInfo } = req.body;
        const [result] = await pool.query('INSERT INTO clients (name, client_type, contact_info) VALUES (?, ?, ?)', [name, clientType, contactInfo]);
        res.json({ id: result.insertId });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/drivers', async (req, res) => {
    try { const [rows] = await pool.query('SELECT * FROM drivers'); res.json(rows); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/drivers', async (req, res) => {
    try {
        const { fullName, licenseNumber, contactInfo } = req.body;
        const [result] = await pool.query('INSERT INTO drivers (full_name, license_number, contact_info) VALUES (?, ?, ?)', [fullName, licenseNumber, contactInfo]);
        res.json({ id: result.insertId });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/drivers/:id', async (req, res) => {
    try { await pool.query('DELETE FROM drivers WHERE id = ?', [req.params.id]); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/vehicles', async (req, res) => {
    try { const [rows] = await pool.query('SELECT * FROM vehicles'); res.json(rows); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/vehicles', async (req, res) => {
    try {
        const { regNumber, vehicleType, specs } = req.body;
        const [result] = await pool.query('INSERT INTO vehicles (reg_number, vehicle_type, specs) VALUES (?, ?, ?)', [regNumber, vehicleType, specs]);
        res.json({ id: result.insertId });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/vehicles/:id', async (req, res) => {
    try { await pool.query('DELETE FROM vehicles WHERE id = ?', [req.params.id]); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/orders', async (req, res) => {
    try {
        const { clientId, routeDescription, scheduledDeparture, scheduledArrival } = req.body;
        const [result] = await pool.query('INSERT INTO orders (client_id, route_description, scheduled_departure, scheduled_arrival) VALUES (?, ?, ?, ?)', [clientId, routeDescription, scheduledDeparture, scheduledArrival]);
        res.json({ id: result.insertId });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/trips', async (req, res) => {
    try {
        const sql = `SELECT td.id, td.status, d.full_name, v.reg_number, o.route_description 
                     FROM trip_details td
                     JOIN drivers d ON td.driver_id = d.id
                     JOIN vehicles v ON td.vehicle_id = v.id
                     JOIN orders o ON td.order_id = o.id`;
        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/trips', async (req, res) => {
    try {
        const { orderId, driverId, vehicleId, status, expenses } = req.body;
        const [result] = await pool.query('INSERT INTO trip_details (order_id, driver_id, vehicle_id, status, expenses) VALUES (?, ?, ?, ?, ?)', [orderId, driverId, vehicleId, status, expenses]);
        res.json({ id: result.insertId });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/trips/:id', async (req, res) => {
    try { await pool.query('DELETE FROM trip_details WHERE id = ?', [req.params.id]); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/logs', async (req, res) => {
    try {
        const { tripId, eventType, comment } = req.body;
        const [result] = await pool.query('INSERT INTO trip_logs (trip_id, event_type, comment) VALUES (?, ?, ?)', [tripId, eventType, comment]);
        res.json({ id: result.insertId });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/logs/:tripId', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM trip_logs WHERE trip_id = ? ORDER BY real_time DESC', [req.params.tripId]);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/orders/filter', async (req, res) => {
    try {
        const { start, end } = req.query;
        const [rows] = await pool.query('SELECT * FROM orders WHERE scheduled_departure BETWEEN ? AND ?', [start, end]);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });

const PORT = 5000;
app.listen(PORT, () => { console.log(`Server running on http://localhost:${PORT}`); });