#!/usr/bin/env node

import fetch from "node-fetch"; // or axios
import fs from "fs";
import path from "path";
import archiver from "archiver";

const apiUrl = "http://localhost:5001/cli/generate"; // Replace with your API URL

// Parse token from command line arguments
const token = process.argv[2];
if (!token) {
  console.error("Error: Token is required. Usage: npx temgen <token>");
  process.exit(1);
}

// Send API request to get the data
async function fetchData(token) {
  console.log({ token });
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ token })
  });

  if (!response.ok) {
    console.error("Failed to fetch data from server:", response.statusText);
    process.exit(1);
  }

  return await response.json();
}

// Generate files and folders based on data
async function generateFiles(data) {
  for (const item of data) {
    const filePath = path.join(
      process.cwd(),
      item.filePath || "",
      item.fileName
    );

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Write file content
    fs.writeFileSync(filePath, item.content);
    console.log(`Created: ${filePath}`);
  }
}

const createFiles = async (filesArray) => {
  try {
    // Loop through each file in the array
    for (const file of filesArray) {
      const filePath = file.filePath;

      // Handle files that start with a dot (like .gitignore, .eslintrc.json)
      let dirPath = path.dirname(filePath);

      // Prepend './' if the file starts with '.' but doesn't already start with './'
      if (filePath.startsWith(".") && !filePath.startsWith("./")) {
        filePath = `./${filePath}`;
        dirPath = path.dirname(filePath);
      }

      // Create the directory structure if it doesn't exist
      if (dirPath !== "." && dirPath !== "./") {
        await fs.promises.mkdir(dirPath, { recursive: true });
        console.log(`Directory created: ${dirPath}`);
      }

      // Write the file with the provided content
      await fs.promises.writeFile(filePath, file.content, "utf8");
      console.log(`File created: ${filePath}`);
    }
  } catch (error) {
    console.error("Error creating files and folders:", error);
  }
};

// Call the function

function jsonToFiles(jsonData, rootDir) {
  jsonData.forEach((file) => {
    const fullFilePath = path.join(
      rootDir,
      file.filePath.split(`\\`).join("/")
    );
    const dir = path.dirname(fullFilePath); // Extract directory path

    // Debug: Log the directory and full file path
    console.log(`Attempting to create directory: ${dir}`);
    console.log(`Full file path for content: ${fullFilePath}`);

    // Ensure directory exists before writing the file
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Directory created: ${dir}`);
      } catch (error) {
        console.error(`Error creating directory: ${error}`);
      }
    } else {
      console.log(`Directory already exists: ${dir}`);
    }

    // Write the file content
    try {
      fs.writeFileSync(fullFilePath, file.content, "utf-8");
      console.log(`File created: ${fullFilePath}`);
    } catch (error) {
      console.error(`Error writing file: ${error}`);
    }
  });
}
// Main function
(async () => {
  try {
    const data = await fetchData(token);
    jsonToFiles(data.data, process.cwd());
    // await generateFiles(data.data);

    // // Optional: create a zip archive
    // await createArchive("output.zip", data);
  } catch (error) {
    console.error("Error:", error);
  }
})();
