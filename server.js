const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// IN-MEMORY DATABASE (NO SQLITE)
let users = [];
let userIdCounter = 1;

console.log('🚀 STARTING WITH IN-MEMORY DATABASE - NO SQLITE');

// Routes
app.post('/api/signup', async (req, res) => {
    try {
        const { name, fatherName, motherName, phone, whatsapp, email, password } = req.body;

        if (!name || !fatherName || !motherName || !phone || !whatsapp || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const newUser = {
            id: userIdCounter++,
            name,
            fatherName,
            motherName,
            phone,
            whatsapp,
            email,
            password,
            createdAt: new Date()
        };

        users.push(newUser);
        console.log('✅ User saved. Total:', users.length);

        res.json({
            success: true,
            message: 'Data collected successfully!',
            data: { id: newUser.id, name: newUser.name, email: newUser.email }
        });

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get stats
app.get('/api/stats', (req, res) => {
    console.log('📊 Stats requested. Total users:', users.length);
    res.json({ success: true, totalUsers: users.length });
});

// Get all users
app.get('/api/users', (req, res) => {
    res.json({ success: true, data: users });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', totalUsers: users.length });
});

// Serve form.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'form.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('===================================');
    console.log('🚀 SERVER STARTED - IN-MEMORY DB');
    console.log('📍 Port:', PORT);
    console.log('💾 Database: IN-MEMORY (NO SQLITE)');
    console.log('📊 Stats endpoint: /api/stats');
    console.log('===================================');
});
