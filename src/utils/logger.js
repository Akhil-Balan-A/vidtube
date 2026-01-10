import pino from "pino";  
// Import the Pino logging library.  
// Pino is a fast, modern logger recommended for scalable applications.

import { config } from "../config/config.js";  
// Import your centralized configuration loader.
// This gives you access to NODE_ENV (development or production).


// Create and export the logger instance.
// This is the single logger used across the entire application.
export const logger = pino({

    // Set the minimum log level based on environment:
    // "debug" → show detailed logs (development)
    // "info"  → suppress debug logs (production)
    level: config.nodeEnv === "production" ? "info" : "debug",

    // Choose the logging output transport based on environment:
    // Development: pretty console logs
    // Production: write logs to file
    transport:
        config.nodeEnv === "development"
            ? {
                // Use pino-pretty for readable, colored console logs in development
                target: "pino-pretty",
                options: {
                    colorize: true,                 // Enable colored output
                    translateTime: "SYS:standard",  // Human-readable timestamps
                    ignore: "pid,hostname",         // Remove noisy metadata
                },
              }
            : {
                // In production, write logs to a file instead of console
                target: "pino/file",
                options: {
                    destination: "./logs/log.txt", // File location for production logs
                },
              },
});
