import express from "express"
import { loginUser,registerUser, listUsers, updateUser, removeUser } from "../controllers/userController.js"
import authMiddleware from "../middleware/auth.js"

const userRouter = express.Router()

userRouter.post("/register",registerUser)
userRouter.post("/login",loginUser)

const requireAdmin = (req, res, next) => {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ success: false, message: "Admin only" });
};

// Admin-only endpoints
userRouter.get("/list", authMiddleware, requireAdmin, listUsers)
userRouter.post("/update", authMiddleware, requireAdmin, updateUser)
userRouter.post("/remove", authMiddleware, requireAdmin, removeUser)

export default userRouter;
