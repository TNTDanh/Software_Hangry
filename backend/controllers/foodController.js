import foodModel from '../models/foodModel.js';
import fs from 'fs';
import path from 'path';
import { setupCloudinary } from '../config/cloudinary.js';

const { cloudinary, enabled: cloudEnabled } = setupCloudinary();

// Helper: lấy public_id từ Cloudinary secure_url
function getCloudinaryPublicIdFromUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    const parts = u.pathname.split('/').filter(Boolean); // ["<cloud_name>","image","upload","v123","folder","name.ext"]
    const uploadIdx = parts.findIndex(p => p === 'upload');
    if (uploadIdx === -1) return null;
    // Bỏ qua 'image','upload' và optional 'v123'
    let afterUpload = parts.slice(uploadIdx + 1);
    if (afterUpload[0] && /^v\d+$/i.test(afterUpload[0])) {
      afterUpload = afterUpload.slice(1);
    }
    const publicIdWithExt = afterUpload.join('/');
    // Bỏ phần mở rộng (.jpg/.png/...)
    return publicIdWithExt.replace(/\.[^.]+$/, '');
  } catch {
    return null;
  }
}

// add food item
const addFood = async (req, res) => {
  try {
    // Validate bắt buộc theo schema
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image is required' });
    }
    const { name, description, category } = req.body;
    const price = Number(req.body.price);

    if (!name || !description || !category || Number.isNaN(price)) {
      // Tránh lưu thiếu do schema required
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    let imageField = null;

    if (req.file.path && cloudEnabled && cloudinary) {
      // Ưu tiên Cloudinary nếu bật
      try {
        const uploaded = await cloudinary.uploader.upload(req.file.path, {
          folder: 'foodfast/foods',
          resource_type: 'image',
          overwrite: true,
        });
        imageField = uploaded.secure_url; // Lưu URL tuyệt đối
      } finally {
        // Dù upload thành/bại vẫn cố gắng xóa file tạm
        try { fs.unlinkSync(req.file.path); } catch {}
      }
    }

    // Fallback local nếu chưa có URL (cloud tắt hoặc upload lỗi)
    if (!imageField) {
      // Multer đang cấu hình lưu trong `process.cwd()/uploads` (xem routes)
      // Lưu lại filename để FE render qua /images/:filename
      imageField = req.file.filename;
    }

    const food = new foodModel({
      name,
      description,
      price,
      category,
      image: imageField,
    });

    await food.save();
    return res.status(201).json({ success: true, message: 'Food Added', data: food });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error' });
  }
};

// all food list
const listFood = async (req, res) => {
  try {
    const foods = await foodModel.find({});
    return res.json({ success: true, data: foods });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error' });
  }
};

// remove food item
const removeFood = async (req, res) => {
  try {
    const food = await foodModel.findById(req.body.id);
    if (!food) return res.json({ success: false, message: 'Not found' });

    const isUrl = typeof food.image === 'string' && /^https?:\/\//i.test(food.image);

    if (isUrl) {
      // Ảnh Cloudinary → xóa trên Cloudinary
      if (cloudEnabled && cloudinary) {
        const publicId = getCloudinaryPublicIdFromUrl(food.image);
        if (publicId) {
          try { await cloudinary.uploader.destroy(publicId); } catch {}
        }
      }
    } else if (food.image) {
      // Ảnh local → xóa file trong uploads/
      const localPath = path.join(process.cwd(), 'uploads', food.image);
      fs.unlink(localPath, () => {});
    }

    await foodModel.findByIdAndDelete(req.body.id);
    return res.json({ success: true, message: 'Food Removed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error' });
  }
};

export { addFood, listFood, removeFood };
