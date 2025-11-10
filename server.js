const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// SIMPLE IN-MEMORY DATABASE (stored in RAM)
let users = [];
let userIdCounter = 1;

// Routes
app.post('/api/signup', async (req, res) => {
    try {
        const { name, fatherName, motherName, phone, whatsapp, email, password } = req.body;

        // Validation
        if (!name || !fatherName || !motherName || !phone || !whatsapp || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if email exists
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Create new user
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

        console.log('✅ New user data saved:', { name, email, id: newUser.id });

        res.status(201).json({
            success: true,
            message: 'Data collected successfully!',
            data: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error('❌ Data collection error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all data
app.get('/api/users', (req, res) => {
    res.json({ success: true, data: users.sort((a, b) => b.createdAt - a.createdAt) });
});

// Get stats - THIS WILL WORK NOW!
app.get('/api/stats', (req, res) => {
    res.json({ success: true, totalUsers: users.length });
});

// Export data as JSON
app.get('/api/export', (req, res) => {
    res.setHeader('Content-Disposition', 'attachment; filename=user-data.json');
    res.setHeader('Content-Type', 'application/json');
    res.json(users);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', totalUsers: users.length });
});

// Home route - serve the form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'form.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`📋 Form: http://localhost:${PORT}/form.html`);
    console.log(`📊 API: http://localhost:${PORT}/api/stats`);
    console.log('💾 Using in-memory database (data resets on server restart)');
});
