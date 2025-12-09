const express = require("express");
const { WebSocketServer } = require("ws");
const questUtils = require("./questUtils");
const routeUtils = require("./routeUtils");

class ChatModule {
  constructor(config) {
    this.grabAcceptedQuests = config.grabAcceptedQuests;
    this.address = config.address;                    // e.g. "/ws/chat"
    this.title = config.title || "Chat";
    this.otherPageTitle = config.otherPageTitle || "Home";
    this.otherPageLink = config.otherPageLink || "/";

    this.router = express.Router();
    this.router.get("/", async (req, res) => {

      //Get accepted quests from quest database

      var acceptedQuests;
      if (this.grabAcceptedQuests) {
        acceptedQuests = await questUtils.getAcceptedQuests(req.session.user);
      } else {
        acceptedQuests = await questUtils.getMyQuests(req.session.user);
      }

      this.startingQuest = null;
      if (acceptedQuests.length > 0) {
        this.startingQuest = acceptedQuests[0];
      }
      console.log("Starting quest:", this.startingQuest);

      routeUtils.renderPage(req, res, "quest-chat", {
        acceptedQuests,
        chatWsAddress: this.address,
        startingQuest: this.startingQuest,
        title: this.title,
        otherPageTitle: this.otherPageTitle,
        otherPageLink: this.otherPageLink
      });
    });


    this._setupWebSocket();
  }

  _setupWebSocket() {
    this.wss = new WebSocketServer({ noServer: true });
    this.wss.on("connection", (ws, req) => {
      const session = req.session;
      if (!session?.user) {
        ws.close();
        return;
      }

      ws.send(JSON.stringify({
        type: "INFO",
        message: "Connected to chat WS!"
      }));

      ws.on("message", async (msg) => {
        console.log("WS: " + msg);
        const data = JSON.parse(msg);

        // --- SEND MESSAGE ---
        if (data.action === "SEND_MESSAGE") {
          const { questDbId, message, attachments } = data;

          await questUtils.addMessage(
            questDbId,
            session.user,
            message,
            attachments || []
          );

          this.broadcast({
            type: "NEW_MESSAGE",
            questDbId,
            username: session.user,
            message,
            attachments: attachments || [],
            timestamp: Date.now()
          });
        }

        // --- GET MESSAGES ---
        else if (data.action === "GET_MESSAGES") {
          const messages = await questUtils.getMessages(data.questDbId);
          ws.send(JSON.stringify({
            type: "MESSAGES_LIST",
            questDbId: data.questDbId,
            messages
          }));
        }

        // --- RESOLVE QUEST ---
        else if (data.action === "RESOLVE_QUEST") {
          await questUtils.closeQuest(data.questDbId);

          this.broadcast({
            type: "QUEST_RESOLVED",
            questDbId: data.questDbId
          });
        }

        else if (data.action === "SELECT_QUEST") {
          const messages = await questUtils.getMessages(data.questDbId);
          const quest = await questUtils.getQuest(data.questDbId);
          ws.send(JSON.stringify({
            type: "SELECT_QUEST",
            quest,
            messages
          }));
        }
      });

      ws.on("close", () => {
        console.log("Chat WS closed");
      });
    });
  }

  // -----------------------------
  //   WebSocket Broadcast
  // -----------------------------
  broadcast(obj) {
    const data = JSON.stringify(obj);
    this.wss.clients.forEach((client) => {
      if (client.readyState === 1) client.send(data);
    });
  }
}

module.exports = ChatModule;