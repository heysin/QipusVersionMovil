import { UsuarioResponse } from "./user";

export interface LoginUsuarioRequest {
  dni: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  isSuccess: boolean;
  hasEnterprise: boolean;
  usuario: UsuarioResponse
}