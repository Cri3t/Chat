<script setup lang="ts">
import { dayjs, ElMessage, ElMessageBox } from "element-plus";
import { ref } from "vue";
import avatarUrl from "@health-chat/assets/images/like.png";
import type { Diary } from "@/types/diary.types";
import { diaryText } from "@/constants/diary";
import { submitDiary as submitDiaryApi } from "@/api/index.ts";

import happyUrl from "@health-chat/assets/images/开心.png";
import sadUrl from "@health-chat/assets/images/悲伤.png";
import anxiousUrl from "@health-chat/assets/images/焦虑.png";
import peacefulUrl from "@health-chat/assets/images/平静.png";
import surprisedUrl from "@health-chat/assets/images/惊讶.png";
import confusedUrl from "@health-chat/assets/images/困惑.png";
import tiredUrl from "@health-chat/assets/images/疲惫.png";
import excitedUrl from "@health-chat/assets/images/兴奋.png";

const createDefaultDiaryForm = (): Diary => ({
  diaryDate: dayjs().format("YYYY-MM-DD"),
  moodScore: 0,
  dominantEmotion: "",
  emotionTriggers: "",
  diaryContent: "",
  sleepQuality: undefined,
  stressLevel: undefined,
});

const diaryForm = ref<Diary>(createDefaultDiaryForm());
const isSubmitting = ref(false);

const emotionOptions = [
  { name: "Happy", url: happyUrl },
  { name: "Anxious", url: anxiousUrl },
  { name: "Peaceful", url: peacefulUrl },
  { name: "Sad", url: sadUrl },
  { name: "Surprised", url: surprisedUrl },
  { name: "Confused", url: confusedUrl },
  { name: "Tired", url: tiredUrl },
  { name: "Excited", url: excitedUrl },
];

const selectEmotion = (emotionName: string) => {
  diaryForm.value.dominantEmotion = emotionName;
};

const resetDiaryForm = async () => {
  try {
    await ElMessageBox.confirm(
      "Are you sure you want to reset the diary?",
      "Reset Diary",
      {
        type: "warning",
        confirmButtonText: "Reset",
        cancelButtonText: "Cancel",
      },
    );

    diaryForm.value = createDefaultDiaryForm();
  } catch {
    // User cancelled the reset.
  }
};

const submitDiaryForm = async (diaryData: Diary) => {
  if (isSubmitting.value) {
    return;
  }

  if (!diaryData.moodScore) {
    ElMessage.warning("Please rate your mood before submitting.");
    return;
  }

  isSubmitting.value = true;

  try {
    await submitDiaryApi(diaryData);
    ElMessage.success("Diary submitted successfully.");
    diaryForm.value = createDefaultDiaryForm();
  } catch (error) {
    console.error(error);
    ElMessage.error("Failed to submit diary. Please try again.");
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="emotionDiary-container">
    <div class="header-section">
      <div class="header-content">
        <el-image :src="avatarUrl" style="width: 60px; height: 60px"></el-image>
        <h1>Emotional Diary</h1>
      </div>
    </div>
    <div class="content">
      <!-- 评分 -->
      <div class="diary-card">
        <h2 class="title">Today's Emotions</h2>
        <div class="section">
          <p>How are you feeling today?(1-10)</p>
          <div class="rate">
            <el-rate
              v-model="diaryForm.moodScore"
              :max="10"
              :texts="diaryText"
              size="large"
              show-text
            />
          </div>
        </div>
      </div>
      <!-- 情绪选择 -->
      <div class="diary-card">
        <div class="title">Your Mood</div>
        <div class="emotion-grid">
          <div
            class="emotion-card"
            v-for="emotion in emotionOptions"
            :key="emotion.name"
            @click="selectEmotion(emotion.name)"
            :class="{ selected: diaryForm.dominantEmotion === emotion.name }"
          >
            <el-image
              :src="emotion.url"
              style="width: 50px; height: 50px"
            ></el-image>
            <div class="emotion-name">{{ emotion.name }}</div>
          </div>
        </div>
      </div>

      <!-- 记录 -->
      <div class="diary-card">
        <div class="title">Today's Reflections</div>
        <div class="detail-form">
          <div class="form-group">
            <div class="form-label">What are you feeling right now?</div>
            <el-input
              type="textarea"
              v-model="diaryForm.diaryContent"
              placeholder="Write your thoughts here..."
              :rows="4"
              maxlength="500"
              show-word-limit
            />
          </div>
          <div class="form-group">
            <div class="form-label">What triggered these feelings?</div>
            <el-input
              type="textarea"
              v-model="diaryForm.emotionTriggers"
              placeholder="Describe the events or thoughts that led to your current emotions..."
              :rows="4"
              maxlength="1000"
              show-word-limit
            />
          </div>
          <div class="life-indicators">
            <div class="indicator-group">
              <div class="form-label">Sleep Quality</div>
              <el-select
                v-model="diaryForm.sleepQuality"
                placeholder="Select sleep quality"
              >
                <el-option label="Poor" :value="1" />
                <el-option label="Fair" :value="2" />
                <el-option label="Good" :value="3" />
                <el-option label="Very Good" :value="4" />
                <el-option label="Excellent" :value="5" />
              </el-select>
            </div>
            <div class="indicator-group">
              <div class="form-label">Pressure Level</div>
              <el-select
                v-model="diaryForm.stressLevel"
                placeholder="Select stress level"
              >
                <el-option label="low" :value="1" />
                <el-option label="medium" :value="2" />
                <el-option label="high" :value="3" />
                <el-option label="very high" :value="4" />
                <el-option label="extreme" :value="5" />
              </el-select>
            </div>
          </div>
          <div class="action-buttons">
            <el-button class="reset-button" @click="resetDiaryForm">
              Reset
            </el-button>
            <el-button
              type="primary"
              :loading="isSubmitting"
              :disabled="isSubmitting"
              @click="submitDiaryForm(diaryForm)"
            >
              Submit
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less" src="@/styles/pages/diary.less"></style>
