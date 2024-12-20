import express from "express";
import cors from "cors";
import crypto from "crypto";

const PORT = 8080;
const app = express();
const database = {
  current: { data: "Hello World", integrity: "" },
  history: [] as { data: string; integrity: string; timestamp: string }[], // Version history
};

app.use(cors());
app.use(express.json());

// This function generates a hash of the given data using SHA-256 which is a cryptographic hash function
// If the data changes, the hash will also change
function generateHash(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

// Initalize the integrity field
database.current.integrity = generateHash(database.current.data); // Hash the initial data

// Routes

app.get("/", (req, res) => {
  res.json(database.current);
});

app.post("/", (req, res) => {
  const { data, hash } = req.body;

  // Verify the integrity of the current data
  const currentHash = generateHash(database.current.data);
  if (currentHash !== database.current.integrity) {
    return res.status(400).json({
      error: "Current data integrity check failed. Update aborted.",
    });
  }

  // Compute hash of the received data
  const computedHash = generateHash(data);

  // Verify the hash of the new data
  if (computedHash !== hash) {
    return res
      .status(400)
      .json({ error: "Hash mismatch. Data integrity check failed." });
  }

  // Save current version to history before updating
  database.history.push({
    data: database.current.data,
    integrity: database.current.integrity,
    timestamp: new Date().toISOString(),
  });

  // Update the current data and its integrity hash
  database.current.data = data;
  database.current.integrity = computedHash;

  res.json({ message: "Data updated successfully." });
});

// Fetch the most recent backup from history
app.get("/backup", (req, res) => {
  if (database.history.length === 0) {
    return res.status(404).json({ error: "No backup available." });
  }

  // Fetch and remove the last backup from history
  const previous = database.history.pop(); // Retrieve the last item and remove it from history

  if (previous) {
    // Update the current data and integrity with the backup values
    database.current.data = previous.data;
    database.current.integrity = previous.integrity;
    return res.json({
      message: "Backup restored successfully.",
      current: database.current,
    });
  }

  res.status(500).json({ error: "Failed to restore backup." });
});

app.post("/tamper", (req, res) => {
  database.current.data = "Tampered Data!"; // Change the data
  res.json({ message: "Data has been tampered with!" });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
