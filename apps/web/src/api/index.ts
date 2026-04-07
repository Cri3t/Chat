import service from "@/utils/request";
import type {
  CreateNewSessionResponse,
  SessionList,
  NewSession,
} from "@/types/consultation.types";
import type { RegisterPayload, LoginPayload } from "@/types/login.types";

// 用户登录
export const login = (data: LoginPayload) => {
  return service.post("/user/login", data);
};
// 用户注册
export const register = (data: RegisterPayload) => {
  return service.post("/user/add", data);
};

//用户退出
export const logout = () => {
  return service.post("/user/logout");
};

//创建新会话
export const createNewSession = (data: NewSession) => {
  return service.post<CreateNewSessionResponse, CreateNewSessionResponse>(
    "psychological-chat/session/start",
    data,
  );
};

//获取会话列表
export const getSessionList = (params: SessionList) => {
  return service.get("/psychological-chat/sessions", { params });
};

//删除会话
export const deleteSessionMessage = (params: { sessionId: string }) => {
  return service.delete(`/psychological-chat/sessions/${params.sessionId}`, {
    params,
  });
};

//获取会话消息
export const getSessionMessage = (params: { sessionId: string }) => {
  return service.get(
    `/psychological-chat/sessions/${params.sessionId}/messages`,
    {
      params,
    },
  );
};
