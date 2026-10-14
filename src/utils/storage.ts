import AsyncStorage from "@react-native-async-storage/async-storage";

let memoryToken: string | null = null;

export const saveToken = async (token: string) => {
  memoryToken = token;

  try {
    await AsyncStorage.setItem("token", token);
  } catch (error) {
    console.warn("No se pudo guardar token en AsyncStorage, usando memoria temporal:", error);
  }
};

export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    return token ?? memoryToken;
  } catch (error) {
    console.warn("No se pudo leer token desde AsyncStorage, usando memoria temporal:", error);
    return memoryToken;
  }
};

export const clearToken = async () => {
  memoryToken = null;

  try {
    await AsyncStorage.removeItem("token");
  } catch (error) {
    console.warn("No se pudo limpiar token de AsyncStorage:", error);
  }
};
