const express = require('express');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Database setup
const db = new sqlite3.Database(':memory:'); // Use in-memory database for testing, or change to a file-based DB

db.serialize(() => {
    db.run("CREATE TABLE users (username TEXT, password TEXT)");
});

// Route for signup
app.post('/signup', (req, res) => {
    const { username, password } = req.body;

    // Check if the user already exists
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (row) {
            return res.status(400).send('User already exists');
        }

        // Hash the password
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                return res.status(500).send('Error hashing password');
            }

            // Store the username and hashed password
            db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hash], (err) => {
                if (err) {
                    return res.status(500).send('Error saving user');
                }
                res.send('Signup successful');
            });
        });
    });
});

// Route for login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (!row) {
            return res.status(400).send('User not found');
        }

        // Compare the password with the stored hashed password
        bcrypt.compare(password, row.password, (err, result) => {
            if (result) {
                res.send('Login successful');
            } else {
                res.status(400).send('Invalid password');
            }
        });
    });
});

// Run server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
