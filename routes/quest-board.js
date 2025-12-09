const express = require('express');
const router = express.Router();
const routeUtils = require('./routeUtils');
const database = require("../database");
const questUtils = require("./questUtils");

router.get('/chat', async (req, res) => {
  var acceptedQuests = await questUtils.getAcceptedQuests(req.session.user);

  routeUtils.renderPage(req, res, 'quest-chat', {
    acceptedQuests: acceptedQuests,
    title: "Quest Chat",
    otherPageTitle: "Quest Board",
    otherPageLink: "/quest-board"
  });
});

router.get('/', async (req, res) => {
  if (req.session.user != null) {
    const quests = await questUtils.getUnacceptedQuests(req.session.user);
    // const acceptedQuests = await questUtils.getAcceptedQuests(req.session.user);
    routeUtils.renderPage(req, res, 'quest-board', {
      title: "Quest Board",
      otherPageTitle: "Quest Chat",
      otherPageLink: "/quest-board/chat",
      quests: quests,
      // acceptedQuests:acceptedQuests
    });
  }
  else {
    routeUtils.renderPage(req, res, 'quest-board', {
      title: "Quest Board",
      otherPageTitle: "Quest Chat",
      otherPageLink: "/quest-board/chat",
      quests: [],
      // acceptedQuests: []
    });
  }
});

module.exports = router;
