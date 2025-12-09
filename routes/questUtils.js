const database = require("../database");
const { ObjectId } = require("mongodb");

// Get unaccepted quests
async function getUnacceptedQuests(username) {
  try {
    return await database.questsCollection.find({
      username: { $ne: username },
      acceptedUsers: { $size: 0 },
      rejectedUsers: { $ne: username }, // exclude if user rejected
      completed: false
    }).toArray();
  } catch (err) {
    console.log("ERROR GETTING QUESTS:", err);
    return [];
  }
}

// Add a new quest
async function newQuest(username, title, description, color, timeMins) {
  try {
    console.log("Adding request to database...");
    await database.questsCollection.insertOne({
      username,
      title,
      description,
      color,
      timeMins,
      acceptedUsers: [],
      rejectedUsers: [],   // initialize rejectedUsers
      completed: false
    });
    return true;
  } catch (err) {
    console.log("ERROR ADDING QUEST:", err);
    return false;
  }
}

// Get quests accepted by user
async function getAcceptedQuests(username) {
  try {
    return await database.questsCollection.find({
      acceptedUsers: username,
      completed: false
    }).toArray();
  } catch (err) {
    console.log("ERROR GETTING ACCEPTED QUESTS:", err);
    return [];
  }
}

// Accept a quest
async function acceptQuest(idString, username) {
  try {
    const result = await database.questsCollection.updateOne(
      { _id: new ObjectId(idString) },
      { $addToSet: { acceptedUsers: username } } // avoids duplicates
    );
    return result.modifiedCount > 0;
  } catch (err) {
    console.log("ERROR ACCEPTING QUEST:", err);
    return false;
  }
}

// Reject a quest
async function rejectQuest(idString, username) {
  try {
    const result = await database.questsCollection.updateOne(
      { _id: new ObjectId(idString) },
      { $addToSet: { rejectedUsers: username } }
    );
    return result.modifiedCount > 0;
  } catch (err) {
    console.log("ERROR REJECTING QUEST:", err);
    return false;
  }
}

// Close a quest
async function closeQuest(idString) {
  try {
    const result = await database.questsCollection.updateOne(
      { _id: new ObjectId(idString) },
      { $set: { completed: true } }
    );
    return result.modifiedCount > 0;
  } catch (err) {
    console.log("ERROR CLOSING QUEST:", err);
    return false;
  }
}

module.exports = {
  getUnacceptedQuests,
  getAcceptedQuests,
  newQuest,
  acceptQuest,
  rejectQuest,
  closeQuest
};
