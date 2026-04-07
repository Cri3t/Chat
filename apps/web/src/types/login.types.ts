export type RegisterPayload = {
  username: string;
  email: string;
  nickname: string;
  phone: string;
  password: string;
  confirmPassword: string;
  gender: number;
  userType: number;
};

export type LoginPayload = {
  username: string;
  password: string;
};
