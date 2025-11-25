import restaurantModel from "../models/restaurantModel.js";
import { filterForOwner } from "../middleware/access.js";

const addRestaurant = async (req, res) => {
  try {
    const {
      name,
      nameEn,
      slug,
      cityId,
      address,
      addressEn,
      coords,
      image,
      deliveryModes,
      minOrder,
      active = true,
    } = req.body;

    if (!name || !slug || !cityId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const restaurant = await restaurantModel.create({
      name,
      nameEn,
      slug,
      cityId,
      address,
      addressEn,
      coords,
      image,
      deliveryModes,
      minOrder,
      active,
    });

    return res.status(201).json({ success: true, data: restaurant });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

const listRestaurants = async (req, res) => {
  try {
    const baseFilter = {};
    if (req.query.cityId) baseFilter.cityId = req.query.cityId;

    const isAdmin = req.user?.role === "admin";
    const activeParam = req.query.active;
    if (typeof activeParam !== "undefined") {
      if (String(activeParam).toLowerCase() !== "all") {
        baseFilter.active = String(activeParam).toLowerCase() === "true";
      }
    } else if (!isAdmin) {
      // mặc định: người dùng/owner chỉ thấy active=true
      baseFilter.active = true;
    }

    const filter = filterForOwner(req.user, baseFilter, "_id");
    const restaurants = await restaurantModel.find(filter).sort({ name: 1 });
    return res.json({ success: true, data: restaurants });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

const toggleRestaurant = async (req, res) => {
  try {
    const { id, active } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "Missing id" });

    if (req.user?.role === "restaurantOwner") {
      const allowed = req.user.restaurantIds || [];
      if (!allowed.find((rid) => rid.toString() === id.toString())) {
        return res.status(403).json({ success: false, message: "Not allowed for this restaurant" });
      }
    }

    // Coerce active to boolean
    const activeFlag =
      typeof active === "boolean"
        ? active
        : typeof active === "string"
        ? active.toLowerCase() === "true"
        : false;

    await restaurantModel.findByIdAndUpdate(id, { active: activeFlag });
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

export { addRestaurant, listRestaurants, toggleRestaurant };
