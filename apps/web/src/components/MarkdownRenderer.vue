<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import type { UnstableTailMode } from "@/utils/markdown";
import {
  renderInlineMarkdown,
  renderMarkdown,
  renderUnstableTail,
  splitMarkdownForStreaming,
} from "@/utils/markdown";

//bec content is necessary for load ,so it's not optional
//we don't need to set default value for content

type Props = {
  content: string;
  isAiMessage?: boolean;
  streaming?: boolean;
  unstableTailMode?: UnstableTailMode;
};

const props = withDefaults(defineProps<Props>(), {
  isAiMessage: false,
  streaming: false,
  unstableTailMode: "inline",
});

const renderedContent = ref("");
const pendingContent = ref(props.content);

let frameId: number | null = null;
let lastStableContent = "";
let lastTailContent = "";
let lastTailMode: UnstableTailMode = props.unstableTailMode;

const flushRender = () => {
  const source = pendingContent.value;

  if (!props.streaming) {
    if (source !== lastStableContent || lastTailContent) {
      renderedContent.value = renderMarkdown(source);
      lastStableContent = source;
      lastTailContent = "";
      lastTailMode = props.unstableTailMode;
    }
    return;
  }

  const { stableContent, unstableTail, hasUnclosedFence } =
    splitMarkdownForStreaming(source);
  let stableHtml = renderedContent.value;

  if (stableContent !== lastStableContent) {
    stableHtml = renderMarkdown(stableContent);
    lastStableContent = stableContent;
  }

  if (hasUnclosedFence) {
    if (
      unstableTail !== lastTailContent ||
      props.unstableTailMode !== lastTailMode
    ) {
      lastTailContent = unstableTail;
      lastTailMode = props.unstableTailMode;
    }

    renderedContent.value = `${stableHtml}${renderUnstableTail(lastTailContent, lastTailMode)}`;
    return;
  }

  if (
    unstableTail !== lastTailContent ||
    props.unstableTailMode !== lastTailMode
  ) {
    lastTailContent = unstableTail;
    lastTailMode = props.unstableTailMode;
  }

  renderedContent.value = `${stableHtml}${renderInlineMarkdown(lastTailContent)}`;
};

const scheduleRender = (content: string) => {
  pendingContent.value = content;

  if (frameId !== null) {
    return;
  }

  frameId = window.requestAnimationFrame(() => {
    frameId = null;
    flushRender();
  });
};

watch(
  () => [props.content, props.streaming, props.unstableTailMode] as const,
  ([content]) => {
    scheduleRender(content);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (frameId !== null) {
    window.cancelAnimationFrame(frameId);
  }
});
</script>

<template>
  <div class="markdown-content" :class="{ 'ai-markdown': isAiMessage }">
    <div v-html="renderedContent"></div>
  </div>
</template>

<style lang="less" scoped src="@/styles/components/markdown.less"></style>
