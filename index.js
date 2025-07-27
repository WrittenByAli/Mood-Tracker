const express = require("express");
const mysql = require("mysql2");
const fetch = require('node-fetch');
const session = require("express-session");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const multer = require('multer');
const bcrypt = require('bcrypt');
const upload = multer({ dest: 'public/uploads/' });

const app = express();
const port = 8000;

// View Engine and Middleware
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "b68a93fa2f1b4bb1a72f26494f6c5aa7b7345678c1db92c8c94a0dc9a7fa1fbb",
  resave: false,
  saveUninitialized: true
}));

// Email Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "programmerbusiness2@gmail.com",
    pass: "hjzx nwoi bhxi oozn"
  },
  logger: true,
  debug: true
});

transporter.verify((error, success) => {
  if (error) console.error("Nodemailer error:", error);
  else console.log("Nodemailer ready");
});

// MySQL Connection
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "(Password of your local database)",
  database: "moodtrack"
});

connection.connect(err => {
  if (err) return console.error("DB Error:", err);
  console.log("Connected to DB");

  connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      username VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      verification_token VARCHAR(255),
      is_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  connection.query(`
    CREATE TABLE IF NOT EXISTS mood_entries (
      email VARCHAR(100) NOT NULL,
      mood VARCHAR(50),
      note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
});

// Middleware to protect routes
function isAuthenticated(req, res, next) {
  if (req.session.userEmail) {
    res.set('Cache-Control', 'no-store');
    return next();
  }
  res.redirect('/login');
}

// Routes
app.get("/", (req, res) => res.render("dashboard.ejs"));
app.get("/signup", (req, res) => res.render("signup.ejs"));
app.get("/login", (req, res) => res.render("login.ejs"));

app.post("/signup", (req, res) => {
  const { username, email, password } = req.body;

  connection.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      return res.render("signup.ejs", { error: "Account with this email already exists." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const insertUser = `
      INSERT INTO users (username, email, password, verification_token, is_verified, created_at)
      VALUES (?, ?, ?, ?, FALSE, NOW())`;

    connection.query(insertUser, [username, email, password, token], err => {
      if (err) throw err;

      const verifyURL = `http://localhost:8000/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
      const mailOptions = {
        from: "programmerbusiness2@gmail.com",
        to: email,
        subject: "Verify Your Email",
        html: `<p>Hi ${username}, please <a href="${verifyURL}">verify your email</a>.</p>`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Mail error:", error);
          return res.render("signup.ejs", { error: "Error sending verification email." });
        }
        res.render("signup.ejs", { success: "Account created! Check your email." });
      });
    });
  });
});

app.get("/verify-email", (req, res) => {
  const { token, email } = req.query;
  if (!token || !email) return res.send("Invalid verification link.");

  const sql = `
    UPDATE users SET is_verified = TRUE, verification_token = NULL
    WHERE email = ? AND verification_token = ?`;

  connection.query(sql, [email, token], (err, result) => {
    if (err || result.affectedRows === 0) return res.send("Invalid or expired token.");
    res.send("Email verified! You can now log in.");
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  connection.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) throw err;
    if (results.length === 0) return res.render("login.ejs", { error: "Email not found" });

    const user = results[0];
    if (!user.is_verified) return res.render("login.ejs", { error: "Please verify your email." });
    if (user.password !== password) return res.render("login.ejs", { error: "Incorrect password" });

    req.session.userEmail = email;
    res.redirect("/application");
  });
});

app.get("/application", isAuthenticated, (req, res) => {
  res.render("application.ejs");
});

app.post("/mood", isAuthenticated, (req, res) => {
  const { mood, note } = req.body;
  const email = req.session.userEmail;

  connection.query(
    `INSERT INTO mood_entries (email, mood, note) VALUES (?, ?, ?)`,
    [email, mood, note],
    err => {
      if (err) throw err;
      res.render("application.ejs", { success: "Mood saved successfully!" });
    }
  );
});

app.get("/history", isAuthenticated, (req, res) => {
  const email = req.session.userEmail;
  connection.query(
    "SELECT mood, note, created_at FROM mood_entries WHERE email = ?",
    [email],
    (err, results) => {
      if (err) return res.send("Error loading mood history");
      res.render("history", { moods: results });
    }
  );
});

app.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.send("Error logging out");
    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
});

// API Quote route
app.get('/api/quote', async (req, res) => {
  try {
    const response = await fetch('https://zenquotes.io/api/random');
    const data = await response.json();
    res.json(data[0]);
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

app.listen(port, () => {
  console.log(`App running at http://localhost:${port}`);
});

app.get('/analytics', (req, res) => {
  const email = req.session.userEmail;
  if (!email) return res.redirect('/login');

  connection.query('SELECT mood FROM mood_entries WHERE email = ?', [email], (err, results) => {
    if (err) {
      console.error(err);
      return res.send('Error loading mood analytics');
    }
    // `results` is an array like [{mood: 'happy'}, {mood: 'sad'}, ...]
    res.render('mood.ejs', { moods: results });
  });
});


//Profile Page

app.post('/profile', isAuthenticated, upload.single('profilePic'), (req, res) => {
  const currentEmail = req.session.userEmail;
  const { username, email: newEmail, oldPassword, newPassword } = req.body;
  const profilePic = req.file ? `/uploads/${req.file.filename}` : null;

  connection.query('SELECT * FROM users WHERE email = ?', [currentEmail], (err, results) => {
    if (err || results.length === 0) {
      return res.render('profile', { error: 'User not found', user: req.body, success: null });
    }

    const user = results[0];

    // Check if new email is different and already exists
    if (newEmail !== currentEmail) {
      connection.query('SELECT * FROM users WHERE email = ?', [newEmail], (err2, emailResults) => {
        if (err2) return res.render('profile', { error: 'Database error', user, success: null });
        if (emailResults.length > 0) {
          return res.render('profile', { error: 'Email is already in use.', user, success: null });
        }
        proceedUpdate();
      });
    } else {
      proceedUpdate();
    }

    function proceedUpdate() {
      if (newPassword) {
        if (!oldPassword) {
          return res.render('profile', { error: 'Please enter your current password to change it.', user, success: null });
        }
        if (oldPassword !== user.password) {
          return res.render('profile', { error: 'Old password is incorrect.', user, success: null });
        }
        updateUser(newPassword);
      } else {
        updateUser(user.password);
      }
    }

    function updateUser(passwordToSave) {
      const picToSave = profilePic || user.profilePic;

      const updateQuery = `
        UPDATE users SET username = ?, email = ?, password = ?, profilePic = ? WHERE email = ?
      `;
      connection.query(updateQuery, [username, newEmail, passwordToSave, picToSave, currentEmail], (err) => {
        if (err) {
          return res.render('profile', { error: 'Error updating profile.', user, success: null });
        }
        req.session.userEmail = newEmail;

        connection.query('SELECT username, email, profilePic FROM users WHERE email = ?', [newEmail], (err, updatedResults) => {
          if (err || updatedResults.length === 0) {
            return res.render('profile', { error: 'Profile updated but error loading data.', user, success: null });
          }
          res.render('profile', { success: 'Profile updated successfully!', user: updatedResults[0], error: null });
        });
      });
    }
  });
});

