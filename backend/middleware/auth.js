import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const getToken = (req) => {
  const bearer = req.headers.authorization || req.headers.Authorization;
  if (typeof bearer === "string" && bearer.toLowerCase().startsWith("bearer ")) {
    return bearer.slice(7).trim();
  }
  return req.headers.token;
};

const decodeToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

const authMiddleware = async (req, res, next) => {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: "Not Authorized Login Again" });
  }
  try {
    const token_decode = decodeToken(token);

    // Kiểm tra trạng thái user trong DB (chặn token cũ khi bị khóa)
    const dbUser = await userModel.findById(token_decode.id);
    if (!dbUser || dbUser.active === false) {
      return res.status(403).json({ success: false, message: "Account is inactive" });
    }

    // Preserve incoming userId (for admin actions) but default to auth user
    if (!req.body.userId) {
      req.body.userId = token_decode.id;
    }
    req.user = {
      id: token_decode.id,
      role: token_decode.role || dbUser.role || "user",
      restaurantIds: token_decode.restaurantIds || dbUser.restaurantIds || [],
    };
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ success: false, message: "Error" });
  }
};

// Optional auth: attach req.user if token present, otherwise continue
export const optionalAuth = (req, _res, next) => {
  const token = getToken(req);
  if (!token) return next();
  try {
    const token_decode = decodeToken(token);
    req.user = {
      id: token_decode.id,
      role: token_decode.role || "user",
      restaurantIds: token_decode.restaurantIds || [],
    };
  } catch (err) {
    console.log("Optional auth parse failed", err?.message);
  }
  next();
};

export default authMiddleware;
