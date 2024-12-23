#!/usr/bin/env node
import fetch from "node-fetch"; // or axios
import fs from "fs";
import path from "path";
import ora from "ora"; // For the spinner loader

const apiUrl = "https://server.temgen.app/api/v1/cli/generate"; // Replace with your API URL

// Parse token from command line arguments
const token = process.argv[2];
const undoFlag = process.argv[3] === "-undo";

if (!token) {
  console.error(
    "\x1b[31mError: Token is required. Usage: npx temgen <token>\x1b[0m"
  );
  process.exit(1);
}

async function fetchData(token) {
  const spinner = ora("Fetching files...").start();

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      spinner.fail(`Failed to fetch files: ${response.statusText}`);
      process.exit(1);
    }

    spinner.succeed("Files fetched successfully.");
    return await response.json();
  } catch (error) {
    spinner.fail("An error occurred while fetching files.");
    console.error("\x1b[31mError:\x1b[0m", error.message);
    process.exit(1);
  }
}

function deleteFiles(jsonData) {
  try {
    jsonData.forEach((file) => {
      const fullFilePath = path.join(
        process.cwd(),
        file.filePath.split(`\\`).join("/")
      );
      if (fs.existsSync(fullFilePath)) {
        fs.unlinkSync(fullFilePath);
      }
    });

    const directories = [
      ...new Set(
        jsonData.map((file) => {
          const filePath = file.filePath.split(`\\`).join("/");
          return path.dirname(path.join(process.cwd(), filePath));
        })
      )
    ].sort((a, b) => b.length - a.length);

    directories.forEach((dir) => {
      if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir);
      }
    });
  } catch (error) {
    console.error(
      "\x1b[33mWarning:\x1b[0m Could not delete some files or directories."
    );
  }
}

function jsonToFiles(jsonData, rootDir) {
  jsonData.forEach((file) => {
    const fullFilePath = path.join(
      rootDir,
      file.filePath.split(`\\`).join("/")
    );
    const dir = path.dirname(fullFilePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullFilePath, file.content, "utf-8");
  });
}

(async () => {
  const spinner = ora("Processing...").start();
  try {
    const data = await fetchData(token);

    if (!undoFlag) {
      spinner.text = "Creating files...";
      jsonToFiles(data.data, process.cwd());
      spinner.succeed("Files created successfully.");
    } else {
      spinner.text = "Deleting files...";
      deleteFiles(data.data);
      spinner.succeed("Files deleted successfully.");
    }
  } catch (error) {
    spinner.fail("An error occurred.");
    console.error("\x1b[31mError:\x1b[0m", error.message);
    process.exit(1);
  }
})();
