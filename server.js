// Basic setup
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const app = express();

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "middlewares/views"));
app.use(express.static("middlewares/public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sessions (only once!)
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 }, // 1 hour
  })
);

// Routes
const homeRoute = require("./routes/index");
app.use("/", homeRoute);

const questBoard = require("./routes/quest-board");
app.use("/quest-board", questBoard);

const requestHelp = require("./routes/request-help");
app.use("/request-help", requestHelp);

const character = require("./routes/character");
app.use("/character", character);

const authRoutes = require("./routes/auth");
app.use("/", authRoutes);


//Database
const database = require("./database");

//Add endpoint for adding items to the database
app.post('/api/items', async (req, res) => {
  try {
    console.log("Posting");
    const newItem = req.body;

    //This is where the magic happens
    const result = await database.accountsCollection.insertOne(newItem);

    res.status(201).json({
      message: "Item added!",
      id: result.insertedId
    });
  } catch (err) {
    // Log the full error to the console
    console.error("MongoDB Insert Error:", err);

    // Send a detailed response
    res.status(500).json({
      message: "Something exploded 💥",
      errorName: err.name,
      errorMessage: err.message,
      stack: err.stack
    });
  }
});





//-------------------------------------
// Error endpoints (MUST BE LAST)
app.use((req, res) => {
  res.status(404).render("404");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("500");
});

//-------------------------------------
// Start server and database connection
const port = process.env.PORT || 3000;
const server = app.listen(port, () => console.log(`Server running http://localhost:${port}`));


const { WebSocketServer } = require("ws");


const wssChat = new WebSocketServer({ noServer: true });
wssChat.on("connection", (ws) => {
  ws.send("CHAT---Connected to chat WS!");

  ws.on("message", (message) => {
    console.log("CHAT---Received message:", message);
  });

  ws.on("close", () => {
    console.log("CHAT---WebSocket connection closed");
  });
});

const wssNotify = new WebSocketServer({ noServer: true });
wssNotify.on("connection", (ws) => {
  ws.send("NOTIFICATION---Connected to notifications WS!");

  ws.on("message", (message) => {
    console.log("NOTIFICATION---Received message:", message);
  });

  ws.on("close", () => {
    console.log("NOTIFICATION---WebSocket connection closed");
  });
});

// Upgrade requests for websockets
server.on("upgrade", (request, socket, head) => {
  const { url } = request;
  if (url === "/ws/chat") {
    wssChat.handleUpgrade(request, socket, head, (ws) => {
      wssChat.emit("connection", ws, request);
    });
  } else if (url === "/ws/notifications") {
    wssNotify.handleUpgrade(request, socket, head, (ws) => {
      wssNotify.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});


async function start() {
  await database.connect();
}

start();