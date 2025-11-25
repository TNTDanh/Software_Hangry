import reviewModel from "../models/reviewModel.js";
import orderModel from "../models/orderModel.js";

// User tạo review sau khi đơn hoàn tất
const addReview = async (req, res) => {
  try {
    const { orderId, userId, restaurantId, rating, ratingFood, ratingDriver, comment, images } = req.body;
    if (!orderId || !userId || !restaurantId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const order = await orderModel.findById(orderId);
    if (!order || order.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const food = Number(ratingFood);
    const driver = Number(ratingDriver);
    const overall = Number(rating);

    // dùng các số hợp lệ để tính trung bình (ưu tiên food/driver, fallback overall)
    const nums = [];
    if (!Number.isNaN(food) && food > 0) nums.push(food);
    if (!Number.isNaN(driver) && driver > 0) nums.push(driver);
    if (!nums.length && !Number.isNaN(overall) && overall > 0) nums.push(overall);

    const ratingAvg = nums.length
      ? Math.min(5, Math.max(1, Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10))
      : undefined;

    const ratingFoodFinal = !Number.isNaN(food) && food > 0
      ? food
      : (!Number.isNaN(overall) && overall > 0 ? overall : undefined);
    const ratingDriverFinal = !Number.isNaN(driver) && driver > 0 ? driver : undefined;
    const ratingFinal = ratingAvg ?? ratingFoodFinal ?? ratingDriverFinal ?? (!Number.isNaN(overall) && overall > 0 ? overall : undefined);

    const review = await reviewModel.create({
      orderId,
      userId,
      restaurantId,
      rating: ratingFinal,
      ratingFood: ratingFoodFinal,
      ratingDriver: ratingDriverFinal,
      ratingAvg,
      comment,
      images: Array.isArray(images) ? images : [],
    });

    return res.status(201).json({ success: true, data: review });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

const listReviews = async (req, res) => {
  try {
    const filter = {};
    if (req.query.restaurantId) filter.restaurantId = req.query.restaurantId;
    if (req.query.orderId) filter.orderId = req.query.orderId;
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.status) filter.status = req.query.status;

    const reviews = await reviewModel.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, data: reviews });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

const approveReview = async (req, res) => {
  try {
    const { id, status = "approved" } = req.body;
    await reviewModel.findByIdAndUpdate(id, { status });
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

export { addReview, listReviews, approveReview };
