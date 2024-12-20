/**
 * This application ensures data integrity and recovery through hashing and backup mechanisms:
 * 
 * 1. **How does the client ensure that their data has not been tampered with?**
 *    - The client fetches the data and its hash (serverHash) from the server.
 *    - It generates hashes for both the current client-side data and the server-provided data.
 *    - These hashes are compared to the serverHash to verify data integrity. If the hashes don't match,
 *      it indicates that the data has been tampered with.
 * 
 * 2. **If the data has been tampered with, how can the client recover the lost data?**
 *    - When tampering is detected, the client restores the last valid state from a backup.
 *    - The backup is fetched from the server's history of previous states, and the client-side data is updated accordingly.
 */

import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:8080";

function App() {
  const [data, setData] = useState<string>("");

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    const response = await fetch(API_URL);
    const { data } = await response.json();
    setData(data);
  };

  const updateData = async () => {
    try {
      // Generate hash of the data
      const hash = await generateHash(data);

      // Send data and hash to the backend
      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ data, hash }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        alert("Data updated successfully.");
        await getData(); // Refresh data
      } else {
        const { error } = await response.json();
        alert(`Failed to update data: ${error}`);
      }
    } catch (error) {
      console.error("Error updating data:", error);
      alert("Failed to update data.");
    }
  };

  const verifyData = async () => {
    try {
      // Fetch the current state from the backend
      const response = await fetch(API_URL);
      const { data: serverData, integrity: serverHash } = await response.json();
  
      // Generate hashes for the client-side and server-side data
      const localHash = await generateHash(data);
      const serverDataHash = await generateHash(serverData);
  
      // This verifies data integrity by checking if the serverHash matches both the hash of the current client-side data 
      // and the hash of the server-side data. This ensures no tampering has occurred on either end.
      if (serverHash === localHash && serverHash === serverDataHash) {
        alert("Data integrity verified: No tampering detected.");
      } else {
        alert("Data has been tampered with! Restoring previous backup...");
        await restoreBackup();
      }
    } catch (error) {
      console.error("Error verifying data:", error);
      alert("Failed to verify data.");
    }
  };
  
  // Restores the most recent backup from the server
  const restoreBackup = async () => {
    try {
      const backupResponse = await fetch(`${API_URL}/backup`);
      if (!backupResponse.ok) {
        alert("No backup available to restore.");
        return;
      }
      
      // Update the client-side state with the restored backup data
      const { data: backupData } = await backupResponse.json();
      setData(backupData);
      await getData(); // Refresh the latest state
      alert("Previous backup restored successfully.");
    } catch (error) {
      console.error("Error restoring backup:", error);
      alert("Failed to restore backup.");
    }
  };
  
  // Generates a SHA-256 hash for the given input string.
  const generateHash = async (input: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input); // Convert input to binary format
    const hashBuffer = await crypto.subtle.digest("SHA-256", data); // Compute the hash
    return Array.from(new Uint8Array(hashBuffer)) // Convert hash to a hexadecimal string
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        position: "absolute",
        padding: 0,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: "20px",
        fontSize: "30px",
      }}
    >
      <div>Saved Data</div>
      <input
        style={{ fontSize: "30px" }}
        type="text"
        value={data}
        onChange={(e) => setData(e.target.value)}
      />

      <div style={{ display: "flex", gap: "10px" }}>
        <button style={{ fontSize: "20px" }} onClick={updateData}>
          Update Data
        </button>
        <button style={{ fontSize: "20px" }} onClick={verifyData}>
          Verify Data
        </button>
      </div>
    </div>
  );
}

export default App;
