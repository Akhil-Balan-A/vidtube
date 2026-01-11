import express from "express";
import {config} from "./config/config.js"
import cookieParser from "cookie-parser";
import cors from "cors"
import morgan from "morgan"
import {errorHandler} from "./middlewares/error.middlewares.js"
import {logger} from "./utils/logger.js"
//express app
const app = express();

//cookie parser
app.use(cookieParser());

//cors
app.use(cors({
    origin: config.corsOrigin,
    credentials: true
}));

//express json
app.use(express.json({ limit: '50mb' }));

//express urlencoded
app.use(express.urlencoded({ limit: '50mb', extended: true }));

//server static files
app.use(express.static('public'));

//morgan 
app.use(morgan("tiny", {
    stream: { write: message => logger.info(message.trim()) }
})
);
logger.info("Server started");

//import routes
import healthCheckRouter from "./routes/healthCheck.routes.js";
import authRouter from "./routes/auth.routes.js";

//Routes
app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/auth", authRouter);

//Global error handler
app.use(errorHandler);


export default app;