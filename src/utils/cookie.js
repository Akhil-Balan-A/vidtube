import {config} from "../config/config.js"
export const setAuthCookies = (res, accessToken, refreshToken) => {
  const options = {
    httpOnly: true,
    secure: config.nodeEnv === "production",// Set to true in production for secure cookies which need https connection. for localhost use false.
  };

  //sending the accessToken and refreshToken as cookies to the client
  res.cookie("accessToken", accessToken, {
    ...options,
    maxAge: 1000 * 60 * 15 // 15 min
  });

  res.cookie("refreshToken", refreshToken, {
    ...options,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  });
};
