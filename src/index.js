import {config} from "./config/config.js";
import app from "./app.js"
import connectDB from "./db/connectDB.js"
import {logger} from "./utils/logger.js"

try {
    //connect DB
    await connectDB()

    //start server
    app.listen(config.port, () => {
        logger.info(`Server running on port ${config.port}...`);
    });
} catch (err) {
    logger.error("DB connection failed:", err.message)
    process.exit(1)
}
