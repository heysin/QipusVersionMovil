// __DEV__ es true cuando ejecutas con 'npx expo start' y false en producción (APK/AAB)
// Forzamos a que use siempre la URL principal de QA
// Escribimos la URL directamente para asegurar que React Native Puro la lea
const API_URL = "https://www.qipus.com/FINEFIS_API/";
// const API_URL = "http://10.0.2.2:5213/";
export default {
  API_URL,
};