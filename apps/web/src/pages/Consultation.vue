<script setup lang="ts">
import { ChatRound, Clock, Plus, Promotion } from "@element-plus/icons-vue";
import { onMounted, ref } from "vue";
import {
  createNewSession as createNewSessionApi,
  getSessionList as getSessionListApi,
  deleteSessionMessage as deleteSessionMessageApi,
  getSessionMessage as getSessionMessageApi,
} from "@/api/index";
import type { Session, Message } from "@/types/consultation.types";
import { ElMessage } from "element-plus";
import { Delete } from "@element-plus/icons-vue";

const robotUrl = new URL("@/assets/images/robot-fill.png", import.meta.url)
  .href;
const avatarUrl = new URL("@/assets/images/like.png", import.meta.url).href;
const userUrl = new URL("@/assets/images/users.png", import.meta.url).href;

const aiMessages = ref([]); //AI消息列表
const userMessages = ref<string>(""); //用户消息
const isSending = ref(false); //是否正在发送
const currentSession = ref<Session | null>(null); //新会话对象
const sessionList = ref<any>([]); //会话列表
const chatMessages = ref<any>([]); //对话消息

// 创建新临时会话，用于临时存储用户的会话
const createNewSession = () => {
  const newSession = {
    sessionId: "temp_" + Date.now(),
    status: "TEMP",
    sessionTitle: "新会话",
  } satisfies Session;
  currentSession.value = newSession;
};

//获取会话列表
const getSessionList = async () => {
  try {
    const res: any = await getSessionListApi({ pageNum: "1", pageSize: "10" });
    sessionList.value = res.records;
    console.log(res);
  } catch (error: any) {
    ElMessage.error(error.message);
  }
};

//点击某个消息进入具体内容
const handleEnterSession = async (session: any) => {
  const sessionId = session?.id;
  if (!sessionId) {
    ElMessage.error("会话ID不存在");
    return;
  }
  try {
    const messageDetail: any = await getSessionMessageApi({ sessionId });
    // chatMessages.value = messageDetail?.data ?? [];
    chatMessages.value = messageDetail;
  } catch (error: any) {
    ElMessage.error(error.message || "系统错误");
  }
};

//删除会话
const handleDeleteSession = async (sessionId: string) => {
  try {
    await deleteSessionMessageApi({ sessionId });
    getSessionList();
  } catch (error: any) {
    ElMessage.error(error.message);
  }
};

//开始会话时，这时候会根据当前会话的状态来判断是否需要创建新会话
const startSession = async (message: string) => {
  //构建会话的时候传递给后端的参数
  const sessionParams: Message = { initialMessage: message, sessionTitle: "" };
  if (currentSession.value?.sessionTitle === "新会话") {
    sessionParams.sessionTitle = `宁渡AI助手 - ${new Date().toLocaleString()}`;
  } else {
    sessionParams.sessionTitle = currentSession.value?.sessionTitle || "";
  }
  try {
    const res = await createNewSessionApi(sessionParams);
    console.log(res);

    const sessionData = {
      sessionId: res.sessionId,
      status: res.status,
      sessionTitle: sessionParams.sessionTitle,
    } satisfies Session;

    if (currentSession.value && currentSession.value.status == "TEMP") {
      Object.assign(currentSession.value, sessionData);
    } else {
      currentSession.value = sessionData;
    }
    getSessionList();
  } catch (error: any) {
    ElMessage.error(error.message);
  }
};

//发送消息
const sendMessage = () => {
  if (!userMessages.value.trim()) return;
  if (isSending.value) {
    ElMessage.error("请稍后再发送");
    return;
  }
  const message = userMessages.value.trim();
  userMessages.value = "";
  if (currentSession.value?.status === "TEMP") {
    startSession(message);
  }
};

//Enter发送逻辑
const handleEnter = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
  }
};

onMounted(() => {
  getSessionList();
  createNewSession();
});
</script>

<template>
  <div class="consultation-container">
    <!-- 侧边栏 -->
    <div class="sidebar">
      <!-- ai助手信息 -->
      <div class="ai-assistant-info">
        <div class="breathing-circle">
          <el-image :src="robotUrl" style="width: 40px; height: 40px" />
        </div>
        <div class="assistant-name">小心</div>
        <div class="online-status">
          <div class="status-dot"></div>
          在线
        </div>
      </div>
      <!-- 会话列表 -->
      <div class="session-history">
        <h4 class="section-title">会话历史</h4>
        <div class="session-list" v-if="sessionList.length > 0">
          <div
            class="session-item"
            v-for="session in sessionList"
            :key="session.id"
            @click="handleEnterSession(session)"
          >
            <div class="session-info">
              <div class="session-title">
                <span>{{ session.sessionTitle }}</span>
                <div class="session-meta">
                  <span class="session-time">{{ session.startedAt }}</span>
                </div>
                <div class="session-preview">
                  {{ session.lastMessageContent || "暂无消息" }}
                </div>
                <div class="session-stats">
                  <span
                    ><el-icon><ChatRound /></el-icon
                    >{{ session.messageCount || 0 }}</span
                  >
                  <span
                    ><el-icon><Clock /></el-icon
                    >{{ session.durationMinutes || 0 }}minutes</span
                  >
                </div>
              </div>
              <div class="session-actions">
                <el-button
                  text
                  type="danger"
                  size="small"
                  @click.stop="handleDeleteSession(session.id)"
                  title="删除会话"
                  :icon="Delete"
                  circle
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="chat-main">
      <!-- 聊天头 -->
      <div class="chat-header">
        <div class="header-left">
          <div class="chat-avatar">
            <el-image :src="avatarUrl" style="width: 40px; height: 40px" />
          </div>
          <div class="chat-info">
            <h2>小心</h2>
            <p>你最贴心的心理健康助手</p>
          </div>
        </div>
        <div class="header-right">
          <el-button circle @click="createNewSession" title="创建新会话"
            ><el-icon><Plus /></el-icon
          ></el-button>
        </div>
      </div>
      <!-- 聊天消息区域 -->
      <div class="chat-messages">
        <div class="message-item ai-message" v-if="aiMessages.length === 0">
          <div class="message-avatar">
            <el-image :src="robotUrl" style="width: 20px; height: 20px" />
          </div>
          <div class="message-content">
            <div class="message-bubble">
              <p>你好，我是小心，你的心理助手。</p>
            </div>
            <div class="message-time">time</div>
          </div>
        </div>
        <div
          class="message-item user-message"
          v-for="message in chatMessages"
          :key="message.id"
          :class="message.senderType === 1 ? 'user-message' : 'ai-message'"
        >
          <div class="message-avatar">
            <el-image
              v-if="message.senderType === 1"
              :src="userUrl"
              style="width: 20px; height: 20px"
            />
            <el-image
              v-if="message.senderType === 2"
              :src="robotUrl"
              style="width: 20px; height: 20px"
            />
          </div>
        </div>
      </div>
      <!-- 聊天输入区域 -->
      <div class="chat-input">
        <div class="input-container">
          <el-input
            class="message-input"
            v-model="userMessages"
            placeholder="今天有什么想跟我聊聊"
            type="textarea"
            :rows="2"
            :autosize="{ minRows: 2, maxRows: 4 }"
            :disabled="isSending"
            @keyup.enter="handleEnter"
            clearable
          />
        </div>
        <el-button type="primary" class="send-btn" @click="sendMessage">
          <el-icon><Promotion /></el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped src="@/styles/pages/consultation.less"></style>
