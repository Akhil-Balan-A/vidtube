import jwt from "jsonwebtoken";
import { ApiError } from "#utils";
import { config } from "#config";

export const verifyJWT = (req, res, next) => {
  let token = null;

  // 1. Web browser (httpOnly cookies)
  if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  // 2. Mobile apps / Postman (Authorization header)
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization?.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Unauthorized - No token", "NO_TOKEN");
  }

  try {
    const decoded = jwt.verify(token, config.accessTokenSecret); // in the dcoded data comes from the part where creating jwt we add the user object.
    req.user = decoded; // here we attach the user object to the request (object inlcude id, username, email)
    next();
  } catch (err) {
    throw new ApiError(401, err?.message || "Invalid or expired token", "TOKEN_INVALID");
  }
};

export const optionalVerifyJWT = (req,res,next)=>{
  let token = null;
  // 1. Web browser (httpOnly cookies)
  if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }
  // 2. Mobile apps / Postman (Authorization header)
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization?.split(" ")[1];
  }
  // If no token, set user to null and continue
  if (!token) {
    req.user = null;
    return next();
  }
  // Try to verify token, but don't throw error if invalid
  try {
    const decoded = jwt.verify(token, config.accessTokenSecret);
    req.user = decoded; // Attach user if token is valid
    next();
  } catch (err) {
    req.user = null; // Set to null if token is invalid
    next();
  }

}




