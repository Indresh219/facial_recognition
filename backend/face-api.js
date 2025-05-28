const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;
const DB_FILE = path.join(__dirname, "db.json");
const PYTHON_API = "http://127.0.0.1:8000";

app.use(cors());
app.use(bodyParser.json({ limit: "20mb" }));

function loadDB() {
  if (fs.existsSync(DB_FILE)) {
    const content = fs.readFileSync(DB_FILE, "utf8");
    if (!content.trim()) return []; // 🔥 Fix blank file error
    try {
      return JSON.parse(content);
    } catch (err) {
      console.error("❌ Error parsing DB file:", err.message);
      return [];
    }
  }
  return [];
}

function saveToDB(entry) {
  const data = loadDB();
  data.push(entry);
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// REGISTER ENDPOINT
app.post("/register", async (req, res) => {
  const { name, image, timestamp } = req.body;
  console.log("➡️ Received registration request:", { name, timestamp });

  if (!name || !image) {
    return res.status(400).json({ error: "Name and image required" });
  }

  try {
    console.log("📤 Sending image to Python server...");
    const response = await axios.post(`${PYTHON_API}/extract-encoding`, { image });

    console.log("🐍 Python response raw:", response.data);

  if (!response.data || !response.data.encoding) {
    console.error("❌ Invalid response from Python server:", response.data);
    return res.status(500).json({ error: "Invalid response from Python server" });
  }

  const { encoding } = response.data;
  const faceEntry = {
    name,
    encoding,
    timestamp: timestamp || new Date().toISOString(),
  };

  saveToDB(faceEntry);
  console.log("✅ Face saved to DB:", faceEntry);
  res.json({ status: "success", entry: faceEntry });
} catch (error) {
  console.error("🔥 Register error:", error.message);
  if (error.response) {
    console.error("🐛 Python error response:", error.response.data);
  }
  res.status(500).json({ error: "Registration error" });
}

});

// ✅ RECOGNIZE ENDPOINT
app.post("/recognize", async (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: "Image is required" });

  try {
    const storedData = loadDB(); // previously saved faces
    const response = await axios.post(`${PYTHON_API}/match-face`, {
      image,
      known_faces: storedData,
    });

    const { match } = response.data;
    if (match) {
      res.json({ match });
    } else {
      res.json({ match: null });
    }
  } catch (err) {
    console.error("Recognition error:", err.message);
    res.status(500).json({ error: "Recognition failed" });
  }
});

app.post("/live-match", async (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: "Image is required" });

  try {
    const knownFaces = loadDB();
    const response = await axios.post(`${PYTHON_API}/match-face`, {
      image,
      known_faces: knownFaces,
    });

    return res.json(response.data);
  } catch (err) {
    console.error("Live match error:", err.message);
    res.status(500).json({ error: "Live match failed" });
  }
});


// START SERVER
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
