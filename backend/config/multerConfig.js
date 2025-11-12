// backend/config/multerConfig.js
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads"); // Đường dẫn tới thư mục lưu trữ tạm thời
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`); // Đặt tên file
  },
});

const upload = multer({ storage });

export default upload;