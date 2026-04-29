<script setup lang="ts">
import { ChatRound, Clock, Plus, Promotion } from "@element-plus/icons-vue";
import { onMounted, ref } from "vue";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import {
  createNewSession as createNewSessionApi,
  getSessionList as getSessionListApi,
  deleteSessionMessage as deleteSessionMessageApi,
  getSessionMessage as getSessionMessageApi,
  getSessionEmotion as getSessionEmotionApi,
} from "@/api/index";
import type { Session, Message } from "@/types/consultation.types";
import MarkdownRenderer from "@/components/MarkdownRenderer.vue";
import { ElMessage } from "element-plus";
import { Delete } from "@element-plus/icons-vue";
import robotUrl from "@health-chat/assets/images/robot-fill.png";
import avatarUrl from "@health-chat/assets/images/like.png";
import userUrl from "@health-chat/assets/images/users.png";

const userInput = ref<string>(""); //用户输入的消息
const isSending = ref(false); //是否正在发送
const currentSession = ref<Session | null>(null); //新会话对象
const sessionList = ref<any>([]); //会话列表
const messages = ref<any>([]); //对话消息
const currentEmotion = ref<any>({
  primaryEmotion: "中性",
  emotionScore: 50,
  isNegative: false,
  riskLevel: 0,
  suggestion: "情绪稳定，继续保持哦！",
  improvementSuggestions: [] as string[],
  riskDescription: "",
}); //当前情绪状态

// 创建新临时会话，用于临时存储用户的会话
const createNewSession = () => {
  const draftSession = {
    sessionId: "temp_" + Date.now(),
    status: "TEMP",
    sessionTitle: "新会话",
  } satisfies Session;
  currentSession.value = draftSession;
  messages.value = [];
  userInput.value = "";
  isSending.value = false;
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
    await getSessionEmotion(sessionId);
    // messages.value = messageDetail?.data ?? [];
    messages.value = messageDetail;
    //更新当前会话状态
    const sessionData = {
      sessionId: "session_" + session.id,
      status: "ACTIVE",
      sessionTitle: session.sessionTitle,
    } satisfies Session;
    console.log(sessionData);
    currentSession.value = sessionData;
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
const startSession = async (userMessage: string) => {
  //构建会话的时候传递给后端的参数
  const sessionParams: Message = {
    initialMessage: userMessage,
    sessionTitle: "",
  };
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

    messages.value.push({
      id: Date.now(),
      senderType: 1,
      content: userMessage,
      createdAt: new Date().toISOString(),
    });

    handleAIResponse(currentSession.value.sessionId, userMessage);
  } catch (error: any) {
    ElMessage.error(error.message);
  }
};

//发送消息
const sendMessage = () => {
  if (!userInput.value.trim()) return;
  if (isSending.value) {
    ElMessage.error("请稍后再发送");
    return;
  }
  const userMessage = userInput.value.trim();
  userInput.value = "";
  if (currentSession.value?.status === "TEMP") {
    startSession(userMessage);
  }
  // todo:status的值为ACTIVE
};

//Enter发送逻辑
const handleEnter = (e: KeyboardEvent) => {
  if (e.shiftKey) return;

  e.preventDefault();
  sendMessage();
};

// 格式化消息内容，处理换行等
const formatMessageContent = (content: string) => {
  return content.replace(/\n/g, "<br>");
};

//AI输出逻辑
const handleAIResponse = (sessionId: string, userMessage: string) => {
  if (isSending.value) {
    ElMessage.warning("正在发送消息，请稍后");
    return;
  }
  isSending.value = true;

  const streamingAiMessage = {
    id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    senderType: 2,
    content: "",
    createdAt: new Date().toISOString(),
  };

  messages.value.push(streamingAiMessage);
  const streamingMessage = messages.value[messages.value.length - 1];

  let contentBuffer = "";
  let flushTimer: ReturnType<typeof window.setTimeout> | null = null;

  const clearFlushTimer = () => {
    if (flushTimer === null) return;

    window.clearTimeout(flushTimer);
    flushTimer = null;
  };

  const flushContentBuffer = () => {
    if (!contentBuffer) {
      clearFlushTimer();
      return;
    }

    streamingMessage.content += contentBuffer;
    contentBuffer = "";
    clearFlushTimer();
  };

  const scheduleFlushContentBuffer = () => {
    if (flushTimer !== null) return;

    flushTimer = window.setTimeout(() => {
      flushTimer = null;
      flushContentBuffer();
    }, 30);
  };

  // 通过fetchEventSource进行流式传输

  const crtl = new AbortController(); //创建一个AbortController实例，用于后续取消请求
  fetchEventSource("/api/psychological-chat/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token: localStorage.getItem("token") as string,
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      sessionId,
      userMessage,
    }),
    signal: crtl.signal,

    onopen: async (response) => {
      if (response.headers.get("Content-Type") !== "text/event-stream") {
        const errorData = await response.json();
        ElMessage.error(errorData.message || "返回数据非流式");
        crtl.abort(); // 取消请求
      }
    },

    onmessage: (streamEvent) => {
      const raw = streamEvent.data.trim();
      if (!raw) return;
      const eventName = streamEvent.event;

      if (eventName === "done") {
        flushContentBuffer();
        isSending.value = false;
        crtl.abort(); // 取消请求
        getSessionList();
        getSessionEmotion(currentSession.value?.sessionId || "");
        return;
      }

      const payload = JSON.parse(raw);
      const code = payload.code;
      if (code === "200" && payload.data && payload.data.content) {
        contentBuffer += payload.data.content;
        scheduleFlushContentBuffer();
      } else if (code !== "200") {
        flushContentBuffer();
        handleErrorAIResponse(payload.message || "AI回复错误");
      }
    },

    onerror: (error) => {
      flushContentBuffer();
      handleErrorAIResponse(error || "AI回复错误，请稍后再试");
      throw error;
    },

    onclose: () => {
      flushContentBuffer();
      getSessionEmotion(currentSession.value?.sessionId || "");
    },
  });
};

//处理ai回复错误
const handleErrorAIResponse = (errorMessage: string) => {
  const lastAiMessage = messages.value[messages.value.length - 1];
  if (lastAiMessage) {
    lastAiMessage.content = "AI回复错误。";
  }
  isSending.value = false;
  ElMessage.error(errorMessage);
};

//处理情绪强度
const getIntensityClass = (dot: number) => {
  const score = currentEmotion.value.emotionScore;
  if (score >= 66) {
    return dot <= 3; // 高强度显示3个点
  } else if (score >= 33) {
    return dot <= 2; // 中强度显示2个点
  } else {
    return dot <= 1; // 低强度显示1个点
  }
};

//处理风险强度
const getRiskLevel = (level: number) => {
  switch (level) {
    case 0:
      return "正常";
    case 1:
      return "关注";
    case 2:
      return "预警";
    case 3:
      return "危机";
    default:
      return "未知风险";
  }
};

const getSessionEmotion = async (sessionId: string) => {
  try {
    const formattedId = sessionId.toString().startsWith("session_")
      ? sessionId
      : `session_${sessionId}`;
    const res: any = await getSessionEmotionApi({
      sessionId: formattedId,
    });
    console.log("情绪分析结果：", res);
    currentEmotion.value = {
      primaryEmotion: res.primaryEmotion,
      emotionScore: res.emotionScore,
      isNegative: res.isNegative,
      riskLevel: res.riskLevel,
      suggestion: res.suggestion,
      improvementSuggestions: res.improvementSuggestions,
      riskDescription: res.riskDescription,
    };
  } catch (error: any) {
    ElMessage.error(error.message || "获取情绪分析失败");
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
      <!-- 情绪花园 -->
      <div class="emotion-garden">
        <div class="garden-header">
          <div class="garden-title">情绪花园</div>
        </div>
        <div class="garden-main">
          <div class="emotion-info">
            <div class="emotion-name">中性</div>
            <div class="emotion-score">50</div>
          </div>
          <div class="warm-tips">
            <div class="emotion-status-text">
              <span class="status-label">今天感觉</span>
              <span class="status-emotion">{{
                currentEmotion.isNegative ? "需要关注" : "很不错"
              }}</span>
            </div>
            <div class="emotion-intensity">
              <span class="intensity-dots">
                <span
                  v-for="dot in 3"
                  :key="dot"
                  class="dot"
                  :class="{ active: getIntensityClass(dot) }"
                ></span
              ></span>
              <span class="intensity-level">{{
                getRiskLevel(currentEmotion.riskLevel)
              }}</span>
            </div>
            <div class="warm-suggestion" v-if="currentEmotion.suggestion">
              <div class="suggestion-icon">💡</div>
              <div class="suggestion-content">
                <div class="suggestion-title">温暖建议</div>
                <div class="suggestion-text">
                  {{ currentEmotion.suggestion }}
                </div>
              </div>
            </div>

            <!-- 治愈小行动 -->
            <div class="healing-actions">
              <div class="actions-title">治愈小行动</div>
              <div class="actions-list">
                <div
                  class="action-item"
                  v-for="action in currentEmotion.improvementSuggestions"
                  :key="action"
                >
                  <div class="action-icon">✨</div>
                  <div class="action-text">{{ action }}</div>
                </div>
              </div>
            </div>
            <!-- 风险提示 -->
            <div
              class="risk-notice"
              v-if="currentEmotion.riskLevel > 1 && currentEmotion.isNegative"
            >
              <div class="notice-icon">🤗</div>
              <div class="notice-content">
                <div class="notice-title">温馨提示</div>
                <div class="notice-text">
                  {{ currentEmotion.riskDescription }}
                </div>
              </div>
            </div>
          </div>
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
        <div class="message-item ai-message" v-if="messages.length === 0">
          <div class="message-avatar">
            <el-image :src="robotUrl" style="width: 20px; height: 20px" />
          </div>
          <div class="message-content">
            <div class="message-bubble">
              <p>你好，我是小心，你的心理助手。</p>
            </div>
          </div>
        </div>
        <div
          class="message-item user-message"
          v-for="message in messages"
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
          <div class="message-content">
            <div class="message-bubble">
              <div
                class="typing-indicator"
                v-if="message.senderType === 2 && isSending && !message.content"
              >
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
              </div>
              <!-- AI消息错误提示 -->
              <div v-else-if="message.isError" class="error-message">
                <p>系统错误，请稍后再试</p>
              </div>
              <!-- AI正常消息展示 -->
              <MarkdownRenderer
                v-else-if="message.senderType === 2 && !message.isError"
                :content="message.content"
                :isAiMessage="true"
                :streaming="
                  isSending && message === messages[messages.length - 1]
                "
              />
              <p
                v-else-if="message.content"
                v-html="formatMessageContent(message.content)"
              ></p>
            </div>
            <div class="message-time">
              {{
                message.senderType === 2 && isSending
                  ? "正在输入..."
                  : message.createdAt
              }}
            </div>
          </div>
        </div>
      </div>
      <!-- 聊天输入区域 -->
      <div class="chat-input">
        <div class="input-container">
          <el-input
            class="message-input"
            v-model="userInput"
            placeholder="今天有什么想跟我聊聊"
            type="textarea"
            :rows="2"
            :autosize="{ minRows: 2, maxRows: 4 }"
            :disabled="isSending"
            @keydown.enter="handleEnter"
            clearable
          />
          <div class="input-footer">
            <span>按 Enter 发送</span>
            <span>{{ userInput.length }}/500</span>
          </div>
        </div>
        <div class="send-btn">
          <el-button
            type="primary"
            class="send-btn"
            @click="sendMessage"
            :disabled="!userInput.trim() || isSending || userInput.length > 500"
          >
            <el-icon><Promotion /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped src="@/styles/pages/consultation.less"></style>
