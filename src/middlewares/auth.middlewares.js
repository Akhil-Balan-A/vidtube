import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import {config} from "../config/config.js"

export const verifyJWT = (req, res, next) => {
  let token = null;

  // 1. Web browser (httpOnly cookies)
  if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  // 2. Mobile apps / Postman (Authorization header)
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Unauthorized - No token", "NO_TOKEN");
  }

  try {
    const decoded = jwt.verify(token, config.accessTokenSecret);
    req.user = decoded;
    next();
  } catch (err) {
    throw new ApiError(401, "Invalid or expired token", "TOKEN_INVALID");
  }
};




