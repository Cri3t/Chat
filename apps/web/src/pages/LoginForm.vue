<script setup lang="ts">
import { Back } from "@element-plus/icons-vue";
import { ref } from "vue";
import { useRouter } from "vue-router";
import type { FormInstance, FormRules } from "element-plus";
import { login as loginApi } from "@/api/index";
import type {
  LoginFormData,
  LoginFormFieldKey,
  LoginFormItem,
} from "@/types/login.types";

const router = useRouter();
const formRef = ref<FormInstance>();

const formItems = [
  {
    label: "用户名",
    prop: "username",
    placeholder: "请输入用户名",
  },
  {
    label: "密   码",
    prop: "password",
    placeholder: "请输入密码",
    type: "password",
  },
] satisfies LoginFormItem[];

const createFieldDefaults = () =>
  Object.fromEntries(formItems.map(({ prop }) => [prop, ""])) as Record<
    LoginFormFieldKey,
    string
  >;

const createFormRules = () =>
  Object.fromEntries(
    formItems.map(({ prop, placeholder }) => [
      prop,
      [{ required: true, message: placeholder, trigger: "blur" }],
    ]),
  ) as FormRules<LoginFormData>;

const formData = ref<LoginFormData>({
  ...createFieldDefaults(),
});

const formRules = createFormRules();

const goHome = () => {
  router.push("/");
};

const handleLogin = async () => {
  if (!formRef.value) return;
  await formRef.value.validate((valid) => {
    if (valid) {
      // console.log("登录表单数据:", formData.value);
      loginApi(formData.value)
        .then((data: any) => {
          console.log(data);
          if (data.token) {
            // console.log("即将存储的数据:", data);
            localStorage.setItem("token", data.token);
            localStorage.setItem("userInfo", JSON.stringify(data.userInfo));
            router.replace("/");
          }
        })
        .catch((error) => {
          console.error("登录失败:", error);
        });
    }
  });
};
</script>

<template>
  <div class="container">
    <div class="title">
      <div class="back-home" @click="goHome">
        <el-icon class="back-icon" :size="20"><Back /> </el-icon>
        <span>返回首页</span>
      </div>
      <div class="title-text">
        <h2>登录您的账户</h2>
        <p>请输入您的用户名和密码</p>
      </div>
    </div>

    <div class="form-container">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        label-position="top"
      >
        <el-form-item
          v-for="item in formItems"
          :key="item.prop"
          :label="item.label"
          :prop="item.prop"
        >
          <el-input
            v-model="formData[item.prop]"
            :placeholder="item.placeholder"
            :type="item.type"
            :show-password="item.type === 'password'"
          ></el-input>
        </el-form-item>
        <el-form-item
          ><div class="login-btn-container">
            <el-button type="primary" @click="handleLogin()">登录</el-button>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <div class="footer">
      <p>还没有账户？<router-link to="/auth/register">立即注册</router-link></p>
    </div>
  </div>
</template>

<style lang="less" scoped src="@/styles/pages/login.less"></style>
