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

export type LoginFormData = {
  username: string;
  password: string;
};

export type LoginFormFieldKey = keyof LoginFormData;

export type LoginFormItem = {
  label: string;
  prop: LoginFormFieldKey;
  placeholder: string;
  type?: "text" | "password";
};
