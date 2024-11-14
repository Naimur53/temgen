#!/usr/bin/env node

import fetch from "node-fetch"; // or axios
import fs from "fs";
import path from "path";
import archiver from "archiver";

const apiUrl = "https://ts-module-creator.onrender.com/cli/generate"; // Replace with your API URL

// Parse token from command line arguments
const token = process.argv[2];
const undoFlag = process.argv[3] === "-undo";

if (!token) {
  console.error("Error: Token is required. Usage: npx temgen <token>");
  process.exit(1);
}

// Send API request to get the data
async function fetchData(token) {
  console.log("Fetching files from server...");
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ token })
  });

  if (!response.ok) {
    console.error("Failed to fetch files from server:", response.statusText);
    process.exit(1);
  }

  return await response.json();
}

function deleteFiles(jsonData) {
  // First delete all files
  try {
    jsonData.forEach((file) => {
      const fullFilePath = path.join(
        process.cwd(),
        file.filePath.split(`\\`).join("/")
      );
      fs.unlinkSync(fullFilePath);
    });
  } catch (error) {}
  // Get unique directories from the jsonData
  const directories = [
    ...new Set(
      jsonData.map((file) => {
        const filePath = file.filePath.split(`\\`).join("/");
        return path.dirname(path.join(process.cwd(), filePath));
      })
    )
  ].sort((a, b) => b.length - a.length); // Sort by depth (deepest first)

  // Try to delete each directory if empty
  directories.forEach((dir) => {
    try {
      // Check if directory exists and is empty
      if (fs.existsSync(dir)) {
        const items = fs.readdirSync(dir);
        if (items.length === 0) {
          fs.rmdirSync(dir);
        }
      }
    } catch (error) {
      // Ignore errors (directory might not be empty or might have permissions issues)
    }
  });
}
// Call the function

function jsonToFiles(jsonData, rootDir) {
  jsonData.forEach((file) => {
    const fullFilePath = path.join(
      rootDir,
      file.filePath.split(`\\`).join("/")
    );
    const dir = path.dirname(fullFilePath); // Extract directory path

    // Debug: Log the directory and full file path

    // Ensure directory exists before writing the file
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (error) {}
    } else {
    }

    // Write the file content
    try {
      fs.writeFileSync(fullFilePath, file.content, "utf-8");
    } catch (error) {}
  });
}
// Main function
(async () => {
  try {
    const data = await fetchData(token);
    if (!undoFlag) {
      jsonToFiles(data.data, process.cwd());
    } else {
      deleteFiles(data.data);
    }
  } catch (error) {
    console.error("Error:", error);
  }
})();
