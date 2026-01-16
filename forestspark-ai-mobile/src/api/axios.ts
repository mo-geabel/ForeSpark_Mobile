import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: "http://10.7.84.82:5000/api",
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");

    if (token) {
      config.headers["x-auth-token"] = token;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
