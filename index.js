require('dotenv').config()
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;
const MONGODB_URI = process.env.MONGODB_URI; // replace with your MongoDB URI

// Enable CORS for all origins
app.use(cors());

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Middleware
app.use(bodyParser.json());

const JSON_FILE = path.join(__dirname, "gunjan.json");

// Define schema for logs
const searchLogSchema = new mongoose.Schema({
  searchTerm: String,
  privacyFilter: String,
  timeTaken: String,
  timestamp: { type: Date, default: Date.now },
});

const SearchLog = mongoose.model("SearchLog", searchLogSchema);

// Endpoint to get users
app.get("/users", (req, res) => {
  fs.readFile(JSON_FILE, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading JSON file:", err);
      return res.status(500).send("Error reading users");
    }
    res.json(JSON.parse(data));
  });
});

// Endpoint to remove a user
app.delete("/users/:username", (req, res) => {
  const { username } = req.params;

  fs.readFile(JSON_FILE, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading JSON file:", err);
      return res.status(500).send("Error reading users");
    }

    const users = JSON.parse(data);
    const updatedUsers = users.filter((user) => user.username !== username);

    fs.writeFile(JSON_FILE, JSON.stringify(updatedUsers, null, 2), (err) => {
      if (err) {
        console.error("Error writing JSON file:", err);
        return res.status(500).send("Error saving users");
      }
      res.json({ message: "User removed successfully", updatedUsers });
    });
  });
});


// Route to save search and filter logs
app.post("/api/logs", async (req, res) => {
  const { searchTerm, privacyFilter, timeTaken } = req.body;

  try {
    const logEntry = new SearchLog({
      searchTerm,
      privacyFilter,
      timeTaken,
    });
    await logEntry.save();
    res.status(201).json({ message: "Log entry saved successfully" });
  } catch (error) {
    console.error("Error saving log entry:", error);
    res.status(500).json({ message: "Error saving log entry" });
  }
});

app.get("/proxy", async (req, res) => {
  const { url } = req.query;
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    res.set("Content-Type", "image/jpeg"); // or appropriate image type
    res.send(response.data);
  } catch (error) {
    res.status(500).send("Error fetching image");
  }
});

// Route to fetch all search and filter logs
app.get("/api/logs", async (req, res) => {
  try {
    // Fetch all logs from the database
    const logs = await SearchLog.find();

    // Respond with the fetched logs
    res.status(200).json(logs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ message: "Error fetching logs" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
