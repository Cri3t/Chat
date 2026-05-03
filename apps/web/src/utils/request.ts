import axios from "axios";
import { ElMessage } from "element-plus";

const service = axios.create({
  baseURL: "/api",
  timeout: 5000,
});

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["token"] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

service.interceptors.response.use(
  (response) => {
    const { data, config } = response;

    if (Number(data.code) === 200) {
      return data.data;
    } else if (data.code === "BUSINESS_ERROR" || data.success === false) {
      ElMessage.error(data.message || "操作失败");
      return Promise.reject(new Error(data.message || "操作失败"));
    }
    if (Number(data.code) === -1) {
      if (!config.url?.includes("/login")) {
        ElMessage.error(data.message || "登录状态已过期，请重新登录");
        localStorage.removeItem("token");
        localStorage.removeItem("userInfo");
        window.location.href = "/auth/login";
        return Promise.reject(
          new Error(data.message || "登录状态已过期，请重新登录"),
        );
      } else {
        ElMessage.error(data.message || "登录状态已过期，请重新登录");
        return Promise.reject(new Error("请求失败"));
      }
    }

    ElMessage.error(data.message || "请求失败");
    return Promise.reject(new Error(data.message || "请求失败"));
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default service;
