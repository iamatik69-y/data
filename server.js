const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// SQLite Database setup
const dbPath = path.join(__dirname, 'data.db');
let db;

// Initialize database
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('❌ Error opening database:', err.message);
                reject(err);
            } else {
                console.log('✅ Connected to SQLite database');
                
                // Create users table if it doesn't exist
                db.run(`CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    fatherName TEXT NOT NULL,
                    motherName TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    whatsapp TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )`, (err) => {
                    if (err) {
                        console.error('❌ Error creating table:', err.message);
                        reject(err);
                    } else {
                        console.log('✅ Users table ready');
                        resolve();
                    }
                });
            }
        });
    });
}

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

        // Insert user data
        const sql = `INSERT INTO users (name, fatherName, motherName, phone, whatsapp, email, password) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        
        db.run(sql, [name, fatherName, motherName, phone, whatsapp, email, password], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Email already exists' });
                }
                console.error('❌ Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            console.log('✅ New user data saved:', { name, email, id: this.lastID });

            res.status(201).json({
                success: true,
                message: 'Data collected successfully!',
                data: {
                    id: this.lastID,
                    name: name,
                    email: email
                }
            });
        });

    } catch (error) {
        console.error('❌ Data collection error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all data
app.get('/api/users', (req, res) => {
    const sql = `SELECT * FROM users ORDER BY createdAt DESC`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('❌ Error fetching users:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true, data: rows });
    });
});

// Get stats
app.get('/api/stats', (req, res) => {
    const sql = `SELECT COUNT(*) as totalUsers FROM users`;
    
    db.get(sql, [], (err, row) => {
        if (err) {
            console.error('❌ Error fetching stats:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true, totalUsers: row.totalUsers });
    });
});

// Export data as JSON
app.get('/api/export', (req, res) => {
    const sql = `SELECT id, name, fatherName, motherName, phone, whatsapp, email, createdAt FROM users ORDER BY createdAt DESC`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('❌ Error exporting data:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.setHeader('Content-Disposition', 'attachment; filename=user-data.json');
        res.setHeader('Content-Type', 'application/json');
        res.json(rows);
    });
});

// Home route
app.get('/', (req, res) => {
    res.send(`
    <html>
        <head>
            <title>Data Collection API</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
                .container { background: #f5f5f5; padding: 30px; border-radius: 10px; }
                .endpoint { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
                .btn { background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 Data Collection API is Running!</h1>
                <p>Your backend server is successfully running with SQLite database.</p>
                <div class="endpoint">
                    <strong>Endpoints:</strong><br>
                    <strong>POST /api/signup</strong> - Submit data<br>
                    <strong>GET /api/users</strong> - View all data<br>
                    <strong>GET /api/stats</strong> - Get statistics<br>
                    <strong>GET /api/export</strong> - Export data as JSON
                </div>
                <div>
                    <a href="/form.html" class="btn">Go to Form</a>
                    <a href="/api/users" class="btn">View Data</a>
                    <a href="/api/export" class="btn">Export Data</a>
                </div>
            </div>
        </body>
    </html>
    `);
});

// Initialize database and start server
initializeDatabase().then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`📍 Local: http://localhost:${PORT}`);
        console.log(`📋 Form: http://localhost:${PORT}/form.html`);
        console.log(`📊 API: http://localhost:${PORT}/api/users`);
        console.log(`💾 Database file: ${dbPath}`);
    });
}).catch(err => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
});
