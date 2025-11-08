import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5002/api",
  withCredentials: false,
});

export default api;
