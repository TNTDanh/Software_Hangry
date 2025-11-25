import express from "express";
import { addCity, listCities } from "../controllers/cityController.js";

const cityRouter = express.Router();

cityRouter.post("/add", addCity);
cityRouter.get("/list", listCities);

export default cityRouter;
