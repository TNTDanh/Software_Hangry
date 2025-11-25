import cityModel from "../models/cityModel.js";

const addCity = async (req, res) => {
  try {
    const { name, nameEn, code, active = true } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: "Missing name/code" });
    }
    const city = await cityModel.create({ name, nameEn, code, active });
    return res.status(201).json({ success: true, data: city });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

const listCities = async (_req, res) => {
  try {
    const cities = await cityModel.find({}).sort({ name: 1 });
    return res.json({ success: true, data: cities });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

export { addCity, listCities };
