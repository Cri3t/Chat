export type RegisterFormData = {
  username: string;
  email: string;
  nickname: string;
  phone: string;
  password: string;
  confirmPassword: string;
  gender: 0;
  userType: 1;
};

export type RegisterFormFieldKey = keyof Omit<
  RegisterFormData,
  "gender" | "userType"
>;

export type RegisterFormItem = {
  label: string;
  prop: RegisterFormFieldKey;
  placeholder: string;
  type?: "text" | "password";
};
