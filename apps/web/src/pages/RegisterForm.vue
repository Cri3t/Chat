<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Back } from "@element-plus/icons-vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { register as registerApi } from "@/api";
import type {
  RegisterFormData,
  RegisterFormFieldKey,
  RegisterFormItem,
} from "@/types/register.types";

const formItems = [
  { label: "用户名", prop: "username", placeholder: "请输入用户名" },
  { label: "邮箱", prop: "email", placeholder: "请输入邮箱" },
  { label: "昵称", prop: "nickname", placeholder: "请输入昵称" },
  { label: "手机号", prop: "phone", placeholder: "请输入手机号" },
  {
    label: "密码",
    prop: "password",
    placeholder: "请输入密码",
    type: "password",
  },
  {
    label: "确认密码",
    prop: "confirmPassword",
    placeholder: "请确认密码",
    type: "password",
  },
] satisfies RegisterFormItem[];

const createFieldDefaults = () =>
  Object.fromEntries(formItems.map(({ prop }) => [prop, ""])) as Record<
    RegisterFormFieldKey,
    string
  >;

const createFormRules = () =>
  Object.fromEntries(
    formItems.map(({ prop, placeholder }) => [
      prop,
      [{ required: true, message: placeholder, trigger: "blur" }],
    ]),
  ) as FormRules<RegisterFormData>;

const formData = ref<RegisterFormData>({
  ...createFieldDefaults(),
  gender: 0,
  userType: 1,
});

const rules = createFormRules();

const router = useRouter();
const goHome = () => {
  router.push("/");
};

const formRef = ref<FormInstance>();

const handleRegister = async () => {
  if (!formRef.value) return;
  await formRef.value?.validate(async (valid, fields) => {
    if (valid) {
      console.log("表单验证通过", fields);
      try {
        const res = await registerApi(formData.value);
        setTimeout(() => {
          router.push("/auth/login");
        }, 500);
        ElMessage.success("注册成功");
        console.log("注册成功", res);
      } catch (error: any) {
        console.log("注册失败", error);
        ElMessage.error(error.message || "注册失败");
      }
    } else {
      console.log("表单验证失败", fields);
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
        <h2>创建你的账户</h2>
        <p>填写注册信息</p>
      </div>
    </div>

    <div class="form-container">
      <el-form
        :model="formData"
        :rules="rules"
        ref="formRef"
        label-width="80px"
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
        <el-form-item>
          <div class="btn">
            <el-button type="primary" @click="handleRegister()">注册</el-button>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <div class="footer">
      <p>已有账户？<router-link to="/auth/login">立即登录</router-link></p>
    </div>
  </div>
</template>

<style lang="less" scoped src="@/styles/pages/register.less"></style>
