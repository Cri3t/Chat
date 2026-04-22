<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { logout as logoutApi } from "@/api/index";
import { ElMessageBox, ElMessage } from "element-plus";
import iconUrl from "@health-chat/assets/images/机器人.png";

const isLoggedIn = ref(false);
const router = useRouter();

const handleLogout = () => {
  ElMessageBox.confirm("确认退出登录？", "退出登录", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      try {
        await logoutApi();
      } catch (error) {
        console.error("退出登录失败:", error);
      }

      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
      isLoggedIn.value = false;

      ElMessage.success("已退出登录");
      router.push("/auth/login");
    })
    .catch(() => {});
};

onMounted(() => {
  isLoggedIn.value = localStorage.getItem("token") !== null;
});
</script>

<template>
  <div class="frontend-layout">
    <div class="navbar-container">
      <div class="brand-section">
        <el-image
          :src="iconUrl"
          style="width: 50px; height: 50px"
          class="brand-logo"
        />
        <h1 class="brand-name">心理健康助手</h1>
      </div>
      <div class="nav-section">
        <router-link to="/" class="nav-link">首页</router-link>
        <router-link to="/consultation" class="nav-link">AI咨询</router-link>
        <router-link to="/emotion" class="nav-link" v-if="isLoggedIn"
          >情绪日志</router-link
        >
        <router-link to="/knowledge" class="nav-link" v-if="isLoggedIn"
          >知识库</router-link
        >
        <el-button class="logout-btn" v-if="isLoggedIn" @click="handleLogout()"
          >退出登录</el-button
        >
        <template v-else>
          <router-link to="/auth/login" class="nav-link">登录</router-link>
          <router-link to="/auth/register" class="nav-link">注册</router-link>
        </template>
      </div>
    </div>
    <div class="main-content"><router-view></router-view></div>
    <div class="footer-container">
      <div class="footer-text">
        <p>© 2026 心理健康助手. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.frontend-layout {
  background-color: #fff;
  .navbar-container {
    max-width: 1200px;
    height: 100%;
    margin: 0 auto;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    .brand-section {
      display: flex;
      align-items: center;
      .brand-name {
        margin-left: 10px;
        font-size: 24px;
        font-weight: 600;
        color: #333;
      }
    }
    .nav-section {
      display: flex;
      align-items: center;
      gap: 40px;
      .nav-link {
        color: #4b5563;
        font-size: 16px;
        font-weight: 500;
        text-decoration: none;
        &:hover {
          color: #4a90e2;
        }
      }
    }
  }

  .footer-container {
    background: #1f2937;
    color: white;
    padding: 15px 0;
    margin-top: auto;
    .footer-text {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 10px;
      text-align: center;
    }
  }
}
</style>
