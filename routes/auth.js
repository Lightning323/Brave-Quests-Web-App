const express = require("express");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const router = express.Router();

const usersFile = path.join(__dirname, "../data/users.json");

function getUsers() {
    return JSON.parse(fs.readFileSync(usersFile));
}

function saveUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// Register Page
router.get("/register", (req, res) => {
    res.render("register");
});

// Submit Register Form
router.post("/register", async (req, res) => {
    const { username, password } = req.body;

    const users = getUsers();

    if (users.find(u => u.username === username)) {
        return res.send("User already exists");
    }

    const hashed = await bcrypt.hash(password, 10);

    users.push({ username, password: hashed });
    saveUsers(users);

    res.redirect("/login");
});

// Login Page
router.get("/login", (req, res) => {
    res.render("login");
});

// Submit Login Form
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const users = getUsers();
    const user = users.find(u => u.username === username);

    if (!user) return res.send("Invalid credentials");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.send("Invalid credentials");

    req.session.user = username;
    res.redirect("/");
});

// Logout
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

module.exports = router;
