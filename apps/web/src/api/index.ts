import service from "@/utils/request";

// 用户登录
export const login = (data: { username: string; password: string }) => {
  return service.post("/user/login", data);
};
// 用户注册
export const register = (data: {
  username: string;
  email: string;
  nickname: string;
  phone: string;
  password: string;
  confirmPassword: string;
  gender: number;
  userType: number;
}) => {
  return service.post("/user/add", data);
};
