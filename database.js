const { MongoClient, ServerApiVersion } = require("mongodb");
const dotenv = require("dotenv");
 
// Load environment variables from .env file
dotenv.config();
 
if(!process.env.MONGODB_URI) {
  throw new Error("Missing MONGODB_URI environment variable");
}
 
const db_uri = process.env.MONGODB_URI;

 
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(db_uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
 
async function connect() {
  try {
    console.log("CONNECTING to MongoDB...");
    await client.connect();
    console.log("CONNECTED to MongoDB yay!");
  } catch (err) {
    console.error("Error connecting to MongoDB:",err);
  }
}

// Connect to the database and set up the collection
const db = client.db("board-data");
const accountsCollection = db.collection("accounts");
const questsCollection = db.collection("quests");
const messageCollection = db.collection("messages");
 
// Export client, db, and collectionName for use in other files
module.exports = { client, db, accountsCollection, questsCollection, messageCollection, connect };
 
