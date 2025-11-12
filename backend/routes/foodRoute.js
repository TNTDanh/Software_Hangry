import express from "express";
import { addFood, listFood, removeFood } from "../controllers/foodController.js"; // Đổi tên hàm nếu cần
import multer from "multer";
import fs from "fs";
import path from "path";

const foodRouter = express.Router();

// Tạo thư mục uploads nếu chưa có (tránh lỗi khi server restart)
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage — dùng để có file tạm (Cloudinary upload từ đây)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir), // Đảm bảo đường dẫn chính xác
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`), // Tạo tên file duy nhất
});

const upload = multer({ storage });

// 🔹 POST /api/food/add  (tự động nhận file dưới field name="image")
foodRouter.post("/add", upload.single("image"), addFood); // Sử dụng addFoodItem trong foodController.js

// 🔹 GET /api/food/list (danh sách món)
foodRouter.get("/list", listFood);

// 🔹 POST /api/food/remove (xóa món)
foodRouter.post("/remove", removeFood);

export default foodRouter;