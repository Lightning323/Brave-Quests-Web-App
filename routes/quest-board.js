const express = require('express');
const router = express.Router();
const routeUtils = require('./routeUtils');
const database = require("../database");
const questUtils = require("./questUtils");
const { WebSocketServer } = require("ws");


//Websockets
const wssQuestsAddress = "/ws/chat";
const wssQuests = new WebSocketServer({ noServer: true });
wssQuests.on("connection", (ws, request) => {
  const session = request.session;
  
  if (!request.session.user) {
    console.log("QUESTS---WebSocket connection rejected (unauthenticated)");
    return;
  }

  ws.send("QUESTS---Connected to chat WS!");

  ws.on("message", async (message) => {
    console.log("QUESTS---Received message:", message.toString());

    if (message.toString().startsWith("ACCEPT---")) {
      var questID = message.toString().substring("ACCEPT---".length);
      var count = await questUtils.acceptQuest(questID, session.user);
      console.log("QUESTS---Accepted quest:", questID, count);
    }
    else if (message.toString().startsWith("REJECT---")) {
      var questID = message.toString().substring("REJECT---".length);
      var count = await questUtils.rejectQuest(questID, session.user);
      console.log("QUESTS---Rejected quest:", questID, count);
    }
  });

  ws.on("close", () => {
    console.log("QUESTS---WebSocket connection closed");
  });
});

// async function sendQuestsWSS(){
//   const quests = await questUtils.getUnacceptedQuests(req.session.user);
//   wssQuests.clients.forEach((client) => {
//     client.send("QUESTS---" + JSON.stringify(quests));
//   });
// }

router.wssQuests = wssQuests;
router.wssQuestsAddress = wssQuestsAddress;

//Routes
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
