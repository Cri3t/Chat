<script setup lang="ts">
import bookUrl from "@health-chat/assets/images/book.png";
import { ref, onMounted } from "vue";
import { dayjs, ElImage, ElMessage } from "element-plus";
import { Histogram, Avatar, List, Platform } from "@element-plus/icons-vue";
import { getArticleList } from "@/api";
import type { Article, ArticleListParams } from "@/types/article.types";

const articleList = ref<Article[]>([]);
const pagination = ref({
  currentPage: "1",
  size: "10",
  total: 0,
});
const pageList = ref<Article[]>([]);

// 获取右侧文章列表
const getPageList = async () => {
  const params: ArticleListParams = {
    sortField: "publishedAt",
    sortDirection: "desc",
    currentPage: pagination.value.currentPage,
    size: pagination.value.size,
  };
  const response = await getArticleList(params);
  pageList.value = response.records;
  pagination.value.total = response.total;
};

const getImage = (url: string) => {
  return url
    ? "http://159.75.169.224:1235" + url
    : "https://file.itndedu.com/psychology_ai.png";
};

const handleChange = async (page: number) => {
  pagination.value.currentPage = page.toString();
  await getPageList();
};

//获取左侧推荐文章列表
onMounted(async () => {
  const params: ArticleListParams = {
    sortField: "readCount",
    sortDirection: "desc",
    currentPage: "1",
    size: "5",
  };
  await getPageList();
  const response = await getArticleList(params);
  articleList.value = response.records;
});
</script>

<template>
  <div class="knowledge-container">
    <div class="header-section">
      <div class="header-content">
        <el-image :src="bookUrl" style="width: 50px; height: 50px" />
        <h1>Knowledge library</h1>
      </div>
    </div>
    <div class="content">
      <!--  推荐文章列表 -->
      <div class="recommend-section">
        <div class="section-title">Recommended Articles</div>
        <div class="recommend-list">
          <div
            class="recommend-item"
            v-for="article in articleList"
            :key="article.id"
          >
            <h4>{{ article.title }}</h4>
            <p class="read-count">
              <el-icon color="black"><Histogram /></el-icon>
              Pageviews:{{ article.readCount }}
            </p>
          </div>
        </div>
      </div>
      <!--  文章列表 -->
      <div class="article-list">
        <div class="article-item" v-for="item in pageList" :key="item.id">
          <el-image
            style="width: 240px; height: 150px"
            :src="getImage(item.coverImage)"
          ></el-image>
          <div class="info">
            <div class="title">
              <h3>{{ item.title }}</h3>
              <el-tag Plain type="primary">{{ item.categoryName }}</el-tag>
            </div>
            <div :style="{ marginTop: '10px' }">
              <div class="flex-box">
                <el-icon><Avatar /></el-icon>
                <span>{{ item.authorName }}</span>
              </div>
              <div class="flex-box">
                <el-icon><List /></el-icon>
                <span>{{ dayjs(item.updatedAt).format("YYYY-MM-DD") }}</span>
              </div>
            </div>
            <div :style="{ marginTop: '10px' }">
              <div class="flex-box">
                <el-icon><Platform /></el-icon>
                <span>{{ item.readCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        style="margin-top: 25px"
        layout="prev, pager, next"
        :page-size="pagination.size"
        :total="pagination.total"
        @change="handleChange"
      />
    </div>
  </div>
</template>

<style lang="less" scoped src="@/styles/pages/knowledge.less"></style>
