const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('character');
});

module.exports = router;

function requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect("/login");
    next();
}

router.get("/", requireLogin, (req, res) => {
    res.render("quest-board", { user: req.session.user });
});
