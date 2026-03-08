<script setup lang="ts">
import { Back } from "@element-plus/icons-vue";
import { ref } from "vue";
import { useRouter } from "vue-router";
import type { FormInstance, FormRules } from "element-plus";
import { login } from "@/api/index";

type FormData = {
  username: string;
  password: string;
};

const router = useRouter();
const formRef = ref<FormInstance>();
const formData = ref<FormData>({
  username: "",
  password: "",
});
const formRules = ref<FormRules>({
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
});

type FormItem = {
  label: string;
  prop: keyof FormData;
  placeholder: string;
  type?: string;
};

const formItems: FormItem[] = [
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
];

const goHome = () => {
  router.push("/");
};

const handleLogin = async () => {
  if (!formRef.value) return;
  await formRef.value.validate((valid, fields) => {
    if (valid) {
      console.log("登录表单数据:", formData.value);
      login(formData.value)
        .then((data: any) => {
          console.log(data);
          if (data.token) {
            console.log("即将存储的数据:", data);
            localStorage.setItem("token", data.token);
            localStorage.setItem("userInfo", JSON.stringify(data.userInfo));
          }
        })
        .catch((error) => {
          console.error("登录失败:", error);
        });
      window.location.href = "/";
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
            v-model="formData[item.prop as keyof FormData]"
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

<style scoped lang="less">
.container {
  width: 60%;
  margin: auto;
  .title {
    .back-home {
      margin-bottom: 60px;
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
        margin-bottom: 10px;
        font-size: 24px;
        font-weight: bold;
        color: #333;
      }
      p {
        margin-bottom: 20px;
        font-size: 16px;
        color: #666;
      }
    }
  }
  .form-container {
    .login-btn-container {
      margin-top: 20px;
      width: 100%;
      text-align: center;
    }
  }
  .footer {
    margin-top: 30px;
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
