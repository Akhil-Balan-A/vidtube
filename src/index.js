import { config } from "#config";
import app from "./app.js";
import connectDB from "./db/mongo.db.js";
import { logger } from "#utils";

try {
  //connect DB
  await connectDB();

  //start server
  app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}...`);
  });
} catch (err) {
  logger.error("DB connection failed:", err.message);
  process.exit(1);
}
