import promotionModel from "../models/promotionModel.js";
import { filterForOwner } from "../middleware/access.js";

const now = () => new Date();
const t = (lang, vi, en) => (lang === "vi" ? vi : en);

const applyPromotion = async (req, res) => {
  try {
    const { code, subTotal, restaurantId, cityId, lang = "en" } = req.body;
    const normalizedCode = typeof code === "string" ? code.trim().toUpperCase() : "";
    const subTotalNum = Number(subTotal);
    if (!normalizedCode || Number.isNaN(subTotalNum)) {
      return res
        .status(400)
        .json({ success: false, message: t(lang, "Thiếu mã hoặc subTotal", "Missing code or subTotal") });
    }

    const promo = await promotionModel.findOne({ code: normalizedCode, active: true });
    if (!promo) return res.json({ success: false, message: t(lang, "Mã không hợp lệ", "Invalid code") });

    const nowDate = now();
    if ((promo.startAt && nowDate < promo.startAt) || (promo.endAt && nowDate > promo.endAt)) {
      return res.json({
        success: false,
        message: t(lang, "Mã hết hạn hoặc chưa bắt đầu", "Promotion expired or not started"),
      });
    }
    if (promo.cityId && cityId && promo.cityId.toString() !== cityId.toString()) {
      return res.json({
        success: false,
        message: t(lang, "Mã không áp dụng cho thành phố này", "Code not valid for this city"),
      });
    }
    if (promo.restaurantId && restaurantId && promo.restaurantId.toString() !== restaurantId.toString()) {
      return res.json({
        success: false,
        message: t(lang, "Mã không áp dụng cho nhà hàng này", "Code not valid for this restaurant"),
      });
    }
    if (promo.minOrder && subTotalNum < promo.minOrder) {
      return res.json({
        success: false,
        message: t(lang, `Cần tối thiểu ${promo.minOrder}`, `Min order ${promo.minOrder}`),
      });
    }

    let discount = 0;
    if (promo.type === "percent") {
      discount = (subTotalNum * promo.value) / 100;
    } else if (promo.type === "amount") {
      discount = promo.value;
    }
    if (promo.maxDiscount) {
      discount = Math.min(discount, promo.maxDiscount);
    }
    discount = Math.max(0, Math.min(discount, subTotalNum));

    return res.json({
      success: true,
      discount,
      promo,
      message: t(lang, "Áp dụng mã thành công", "Promotion applied"),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: t(req.body.lang || "en", "Lỗi hệ thống", "Error"),
    });
  }
};

const createPromotion = async (req, res) => {
  try {
    if (req.user?.role === "restaurantOwner") {
      const allowed = req.user.restaurantIds || [];
      if (!req.body.restaurantId) {
        return res.status(400).json({ success: false, message: "restaurantId required for owner" });
      }
      if (!allowed.find((id) => id.toString() === req.body.restaurantId.toString())) {
        return res.status(403).json({ success: false, message: "Not allowed for this restaurant" });
      }
    }

    const payload = {
      ...req.body,
      code: req.body.code?.toUpperCase(),
    };
    const promo = await promotionModel.create(payload);
    return res.status(201).json({ success: true, data: promo });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

const listPromotions = async (req, res) => {
  try {
    const baseFilter = {};
    if (req.query.restaurantId) baseFilter.restaurantId = req.query.restaurantId;
    if (req.query.cityId) baseFilter.cityId = req.query.cityId;
    const filter = filterForOwner(req.user, baseFilter);
    const promos = await promotionModel.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, data: promos });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

export { applyPromotion, createPromotion, listPromotions };
