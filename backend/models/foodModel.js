import mongoose from "mongoose";

const foodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },          // tiếng Việt mặc định
    nameEn: { type: String },                        // tên tiếng Anh (tùy chọn)
    description: { type: String, required: true },   // mô tả tiếng Anh hoặc chung
    descriptionVi: { type: String },                 // mô tả tiếng Việt (tùy chọn)
    price: { type: Number, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "restaurant" },
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: "city" },
    tags: [{ type: String }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const foodModel = mongoose.models.food || mongoose.model("food", foodSchema);

export default foodModel;
