import express from "express";
import { addFood, listFood, removeFood } from "../controllers/foodController.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import authMiddleware, { optionalAuth } from "../middleware/auth.js";
import { requireOwnerOrAdmin } from "../middleware/access.js";

const foodRouter = express.Router();

// Tạo thư mục uploads nếu chưa có (tránh lỗi khi server restart)
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage để lưu tạm file (Cloudinary upload nếu bật)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});

const upload = multer({ storage });

// POST /api/food/add (nhận file name="image")
foodRouter.post("/add", authMiddleware, requireOwnerOrAdmin, upload.single("image"), addFood);

// GET /api/food/list (danh sách món) — optional auth để filter cho owner
foodRouter.get("/list", optionalAuth, listFood);

// POST /api/food/remove (xóa món)
foodRouter.post("/remove", authMiddleware, requireOwnerOrAdmin, removeFood);

export default foodRouter;
