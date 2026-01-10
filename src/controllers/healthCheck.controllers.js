import { ApiResponse } from "../utils/ApiResponse.js";

export const healthCheck = async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, "Server is healthy", {
      uptime: process.uptime(),
      timestamp: Date.now()
    })
  );
};
