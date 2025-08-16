
import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://mailflow-interview-sys-production-2001.up.railway.app",

});

apiClient.interceptors.request.use((config) => {
  console.log("Request made with ", process.env.REACT_APP_API_BASE_URL);
  const token = localStorage.getItem("token"); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
