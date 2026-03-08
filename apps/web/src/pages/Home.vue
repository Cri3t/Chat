<script setup lang="ts">
const robotUrl = new URL("@/assets/images/robot-fill.png", import.meta.url)
  .href;
</script>

<template>
  <div class="home-container">
    <div class="content">
      <div class="text">
        <h2 class="title">
          欢迎使用
          <span class="highlight-text">心理健康助手</span>
        </h2>
        <p class="description">我们致力于为您提供最专业的心理咨询服务。</p>
        <div class="hero-actions">
          <el-button size="large">开始咨询</el-button>
          <el-button type="primary" size="large" style="border-color: #fff"
            >记录心情</el-button
          >
        </div>
      </div>
      <div class="robot">
        <el-image :src="robotUrl" style="width: 200px; height: 200px" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.home-container {
  background: linear-gradient(
      90deg,
      rgb(74, 156, 140) 0%,
      rgb(61, 138, 122) 100%
    )
    rgba(74, 156, 140, 0.95);
  color: white;
  padding: 5rem 0;
  height: calc(100vh - 285px);
  display: flex;
  align-items: center;
  justify-content: center;
  .content {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 30px;
    .text {
      width: 500px;
      .title {
        font-size: 45px;
        font-weight: bold;
        // line-height: 1.2;
        margin-bottom: 15px;
        .highlight-text {
          color: #ffd700;
        }
      }
      .hero-actions {
        display: flex;
        margin-top: 30px;
      }
    }
    .robot {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 260px;
      height: 260px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.2);
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.15) 0%,
        rgba(255, 255, 255, 0.05) 100%
      );
      box-shadow:
        0 15px 35px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
    }
  }
}
</style>
