import express from "express"
import { loginUser,registerUser, listUsers, updateUser, removeUser } from "../controllers/userController.js"

const userRouter = express.Router()

userRouter.post("/register",registerUser)
userRouter.post("/login",loginUser)
// Admin-ish endpoints (currently open like other admin routes)
userRouter.get("/list", listUsers)
userRouter.post("/update", updateUser)
userRouter.post("/remove", removeUser)

export default userRouter;
