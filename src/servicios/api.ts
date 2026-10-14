import axios from "axios";
import config from "../utils/config";
import { getToken } from "../utils/storage";

const api = axios.create({
  baseURL: config.API_URL,
  timeout: 30000,
});

api.interceptors.request.use(
  async (request) => {
    const token = await getToken();

    if (token) {
      request.headers.Authorization = `Bearer ${token}`;
    }

    return request;
  },
  (error) => Promise.reject(error)
);

export default api;
