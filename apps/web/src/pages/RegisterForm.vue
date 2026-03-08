<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Back } from "@element-plus/icons-vue";
import { ElMessage, type FormInstance } from "element-plus";
import { register } from "@/api";

type FormData = {
  username: string;
  email: string;
  nickname: string;
  phone: string;
  password: string;
  confirmPassword: string;
  gender: 0;
  userType: 1;
};

const formData = ref({
  username: "",
  email: "",
  nickname: "",
  phone: "",
  password: "",
  confirmPassword: "",
  gender: 0,
  userType: 1,
});

const rules = ref({
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  email: [{ required: true, message: "请输入邮箱", trigger: "blur" }],
  nickname: [{ required: true, message: "请输入昵称", trigger: "blur" }],
  phone: [{ required: true, message: "请输入手机号", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
  confirmPassword: [{ required: true, message: "请确认密码", trigger: "blur" }],
});

type FormItem = {
  label: string;
  prop: keyof FormData;
  placeholder: string;
  type?: string;
};

const formItems: FormItem[] = [
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
];

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
        const res = await register(formData.value);
        ElMessage.success("注册成功");
        setTimeout(() => {
          router.push("/auth/login");
        }, 500);
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
            v-model="formData[item.prop as keyof FormData]"
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

<style scoped lang="less">
.container {
  width: 50%;
  margin: auto;
  .title {
    .back-home {
      margin-bottom: 20px;
      margin-top: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      transition: color 0.3s;
      color: #666;

      &:hover {
        color: #333;
      }

      span {
        font-size: 20px;
        margin-left: 5px;
      }
    }
    .title-text {
      text-align: center;
      h2 {
        font-size: 24px;
        margin-bottom: 10px;
      }
      p {
        font-size: 18px;
        color: #6b7280;
      }
    }
  }
  .form-container {
    margin-top: 30px;
    .btn {
      text-align: center;
      margin-top: 20px;
      width: 100%;
    }
  }
  .footer {
    margin-top: 20px;
    margin-bottom: 10px;
    text-align: center;
    p {
      font-size: 14px;
      color: #666;
      a {
        color: #4a90e2;
        text-decoration: none;
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}
</style>
