const express = require("express");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const router = express.Router();

//Important registration methods
function redirectIfLoggedIn(req, res, next) {
    if (req.session.user) {
        return res.redirect("/");
    }
    next();
}

async function addAccount(username, password) {
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds); //Hash the password
        console.log("Adding account:", username, hashedPassword);
        return true;
    } catch (err) {
        console.log("ERROR ADDING ACCOUNT:", err);
        return false;
    }
}

async function passwordMatch(password, bcryptHash) {
    return await bcrypt.compare(password, bcryptHash);
}


//Endpoints
// Register Page
router.get("/register", redirectIfLoggedIn, (req, res) => {
    res.render("register");
});

router.post("/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.json({ error: "Missing username or password" });
    }

    // if (users.some(u => u.username === username)) {
    //     return res.status(400).json({ error: "Username already exists" });
    // }

    if (await addAccount(username, password)) {
        // res.redirect("/login");
        return res.json({ message: "Account added" });
    } else {
        return res.json({ error: "Error Adding account" });
    }
});

// Login Page
router.get("/login", redirectIfLoggedIn, (req, res) => {
    res.render("login");
});

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
