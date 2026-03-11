import cron from "node-cron";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Ensure backup directory exists
const backupDir = "C:\\backup";
if (!fs.existsSync(backupDir)) {
    try {
        fs.mkdirSync(backupDir, { recursive: true });
        console.log(`Created backup directory at ${backupDir}`);
    } catch (err) {
        console.error("Failed to create backup directory:", err);
    }
}

cron.schedule("30 17 * * *", () => {
    const date = new Date().toISOString().split("T")[0];

    // Read MONGODB_URI from environment variables
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.log("Backup failed: MONGODB_URI is not defined in environment variables.");
        return;
    }

    const mongodumpPath = '"C:\\Users\\Admin\\Downloads\\mongodb-database-tools-windows-x86_64-100.14.1\\mongodb-database-tools-windows-x86_64-100.14.1\\bin\\mongodump.exe"';
    const command = `${mongodumpPath} --uri="${uri}" --archive=${backupDir}\\mongo_${date}.gz --gzip`;

    console.log(`Starting backup for ${date}...`);
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error("Backup failed:", error);
            // Optionally log stderr
            if (stderr) console.error("mongodump stderr:", stderr);
            return;
        }
        console.log(`Backup completed successfully: mongo_${date}.gz`);
    });
});

console.log("Backup scheduler started...");
