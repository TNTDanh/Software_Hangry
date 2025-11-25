import foodModel from "../models/foodModel.js";
import restaurantModel from "../models/restaurantModel.js";
import fs from "fs";
import path from "path";
import { setupCloudinary } from "../config/cloudinary.js";
import { filterForOwner } from "../middleware/access.js";

const { cloudinary, enabled: cloudEnabled } = setupCloudinary();

// Helper: lấy public_id từ Cloudinary secure_url
function getCloudinaryPublicIdFromUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    const parts = u.pathname.split("/").filter(Boolean); // ["<cloud_name>","image","upload","v123","folder","name.ext"]
    const uploadIdx = parts.findIndex((p) => p === "upload");
    if (uploadIdx === -1) return null;
    // Bỏ qua 'image','upload' và optional 'v123'
    let afterUpload = parts.slice(uploadIdx + 1);
    if (afterUpload[0] && /^v\d+$/i.test(afterUpload[0])) {
      afterUpload = afterUpload.slice(1);
    }
    const publicIdWithExt = afterUpload.join("/");
    // Bỏ phần mở rộng (.jpg/.png/...)
    return publicIdWithExt.replace(/\.[^.]+$/, "");
  } catch {
    return null;
  }
}

const parseTags = (tags) => {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string" && tags.length) {
    return tags.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return [];
};

// add food item
const addFood = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }
    const {
      name,
      nameEn,
      description,
      descriptionVi,
      category,
      restaurantId,
      cityId,
      tags,
    } = req.body;
    const price = Number(req.body.price);

    const trimmedName = name?.trim();
    const trimmedNameEn = nameEn?.trim();
    const trimmedDesc = description?.trim();
    const trimmedDescVi = descriptionVi?.trim();

    if (
      !trimmedName ||
      !trimmedNameEn ||
      !trimmedDesc ||
      !trimmedDescVi ||
      !category ||
      Number.isNaN(price)
    ) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Kiểm tra nhà hàng hoạt động
    if (restaurantId) {
      const rest = await restaurantModel.findById(restaurantId);
      if (!rest || rest.active === false) {
        return res.status(400).json({ success: false, message: "Restaurant inactive or not found" });
      }
    }

    let imageField = null;

    if (req.file.path && cloudEnabled && cloudinary) {
      try {
        const uploaded = await cloudinary.uploader.upload(req.file.path, {
          folder: "foodfast/foods",
          resource_type: "image",
          overwrite: true,
        });
        imageField = uploaded.secure_url;
      } finally {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
      }
    }

    if (!imageField) {
      imageField = req.file.filename;
    }

    const food = new foodModel({
      name: trimmedName,
      nameEn: trimmedNameEn,
      description: trimmedDesc,
      descriptionVi: trimmedDescVi,
      price,
      category,
      image: imageField,
      restaurantId: restaurantId || null,
      cityId: cityId || null,
      tags: parseTags(tags),
    });

    await food.save();
    return res.status(201).json({ success: true, message: "Food Added", data: food });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

// all food list (optional filter by city/restaurant/category)
const listFood = async (req, res) => {
  try {
    const baseFilter = {};
    if (req.query.cityId) baseFilter.cityId = req.query.cityId;
    if (req.query.restaurantId) baseFilter.restaurantId = req.query.restaurantId;
    if (req.query.category) baseFilter.category = req.query.category;

    const filter = filterForOwner(req.user, baseFilter);
    const isAdmin = req.user?.role === "admin";

    if (!isAdmin) {
      const restaurantQuery = {};
      if (filter.cityId) restaurantQuery.cityId = filter.cityId;
      if (filter.restaurantId) restaurantQuery._id = filter.restaurantId;
      restaurantQuery.active = true;

      // Kết hợp với allowed ids (nếu filterForOwner đã set $in)
      if (filter.restaurantId && typeof filter.restaurantId === "object" && filter.restaurantId.$in) {
        restaurantQuery._id = { $in: filter.restaurantId.$in };
      }

      const activeRestaurants = await restaurantModel.find(restaurantQuery, { _id: 1 });
      const allowedIds = activeRestaurants.map((r) => r._id);
      if (!allowedIds.length) {
        return res.json({ success: true, data: [] });
      }
      filter.restaurantId = { $in: allowedIds };
    }

    const foods = await foodModel.find(filter);
    return res.json({ success: true, data: foods });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

// remove food item
const removeFood = async (req, res) => {
  try {
    const food = await foodModel.findById(req.body.id);
    if (!food) return res.json({ success: false, message: "Not found" });

    const isUrl = typeof food.image === "string" && /^https?:\/\//i.test(food.image);

    if (isUrl) {
      // Ảnh Cloudinary => xóa trên Cloudinary
      if (cloudEnabled && cloudinary) {
        const publicId = getCloudinaryPublicIdFromUrl(food.image);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch {}
        }
      }
    } else if (food.image) {
      // Ảnh local => xóa file trong uploads/
      const localPath = path.join(process.cwd(), "uploads", food.image);
      fs.unlink(localPath, () => {});
    }

    await foodModel.findByIdAndDelete(req.body.id);
    return res.json({ success: true, message: "Food Removed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

export { addFood, listFood, removeFood };
