import { config } from "../config/config.js";
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInfo =await mongoose.connect(`${config.mongodbUri}/${DB_NAME}`);
        console.log(`Database connected! DB host: ${connectionInfo.connection.host}`);
    } catch (error) {
        console.log("MongodDB Connection error",error);
        process.exit(1);
    }
}

export default connectDB

