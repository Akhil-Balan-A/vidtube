import express from "express";
import {config} from "#config";
import cookieParser from "cookie-parser";
import cors from "cors"
import morgan from "morgan"
import {errorHandler} from "#middlewares"
import {logger} from "#utils"
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
import {healthCheckRouter,authRouter,userRouter,videoRouter,commentRouter} from "#routes";

//Routes
app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);


//Global error handler
app.use(errorHandler);


export default app;