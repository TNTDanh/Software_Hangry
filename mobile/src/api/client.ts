import axios from "axios";
import Constants from "expo-constants";
import { useAuthStore } from "../../lib/store/auth";

export const API_URL =
  (Constants.expoConfig?.extra as any)?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
  "http://192.168.9.14:5000";

export type FoodDto = {
  _id: string;
  name: string;
  nameEn?: string;
  description?: string;
  descriptionVi?: string;
  descriptionEn?: string;
  image?: string | null;
  category?: string;
  restaurantName?: string;
  restaurantNameEn?: string;
  restaurantId?: string;
  address?: string;
  addressEn?: string;
  cityId?: string;
  cityName?: string;
  city?: { _id?: string; name?: string };
  deliveryModes?: string[];
  etaMinutes?: number;
  price: number;
  ratingFood?: number;
  ratingDriver?: number;
  ratingAvg?: number;
};

const client = axios.create({ baseURL: API_URL });

client.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  (config.headers as any)["Content-Type"] = "application/json";

  const url = config.url || "";
  const skipAuth =
    url.includes("/api/user/login") || url.includes("/api/user/register");

  if (!skipAuth) {
    const token = useAuthStore.getState().token;
    if (token) (config.headers as any).token = token;
  }
  return config;
});

export default client;
