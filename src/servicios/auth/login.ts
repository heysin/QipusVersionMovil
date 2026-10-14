import axios from "axios";
import config from "../../utils/config";
import { LoginUsuarioRequest } from "../../models/auth";
import { saveToken } from "../../utils/storage";

const login = async (credentials: LoginUsuarioRequest) => {
  const response = await axios.post(`${config.API_URL}api/Auth/login`, credentials);

  const token = response?.data?.data?.token ?? response?.data?.token;

  if (token) {
    await saveToken(token);
  }

  return response.data;
};

export default { login };