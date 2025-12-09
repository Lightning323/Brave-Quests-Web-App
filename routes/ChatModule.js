const express = require("express");
const { WebSocketServer } = require("ws");
const questUtils = require("./questUtils");
const routeUtils = require("./routeUtils");

class ChatModule {
  constructor(config) {
    this.address = config.address;                    // e.g. "/ws/chat"
    this.title = config.title || "Chat";
    this.otherPageTitle = config.otherPageTitle || "Home";
    this.otherPageLink = config.otherPageLink || "/";

    this.router = express.Router();
    this.router.get("/", async (req, res) => {
      const acceptedQuests = await questUtils.getAcceptedQuests(req.session.user);

      var startingQuestID = null;
      if (acceptedQuests.length > 0) {
        startingQuestID = acceptedQuests[0].questDbId
      }

      routeUtils.renderPage(req, res, "quest-chat", {
        acceptedQuests,
        chatWsAddress: this.address,
        startingQuestID: startingQuestID,
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
      console.log("WebSocket connection opened");
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
            session.user.username,
            message,
            attachments || []
          );

          this.broadcast({
            type: "NEW_MESSAGE",
            questDbId,
            username: session.user.username,
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