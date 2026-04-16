<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import type { UnstableTailMode } from "@/utils/markdown";
import {
  renderInlineMarkdown,
  renderMarkdown,
  renderUnstableTail,
  splitMarkdownForStreaming,
} from "@/utils/markdown";

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

  const { stableContent, unstableTail, hasUnclosedFence } = splitMarkdownForStreaming(source);
  let stableHtml = renderedContent.value;

  if (stableContent !== lastStableContent) {
    stableHtml = renderMarkdown(stableContent);
    lastStableContent = stableContent;
  }

  if (hasUnclosedFence) {
    if (unstableTail !== lastTailContent || props.unstableTailMode !== lastTailMode) {
      lastTailContent = unstableTail;
      lastTailMode = props.unstableTailMode;
    }

    renderedContent.value = `${stableHtml}${renderUnstableTail(lastTailContent, lastTailMode)}`;
    return;
  }

  if (unstableTail !== lastTailContent || props.unstableTailMode !== lastTailMode) {
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

<style lang="less" scoped>
.markdown-content {
  line-height: 1.6;
  color: inherit;
  word-break: break-word;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  margin: 1em 0 0.5em 0;
  font-weight: 600;
  line-height: 1.3;
}

.markdown-content :deep(h1) {
  font-size: 1.5em;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.3em;
}

.markdown-content :deep(h2) {
  font-size: 1.3em;
  color: #374151;
}

.markdown-content :deep(h3) {
  font-size: 1.1em;
  color: #4b5563;
}

.markdown-content :deep(p) {
  margin: 0.5em 0;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.markdown-content :deep(li) {
  margin: 0.3em 0;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #d1d5db;
  padding-left: 1em;
  margin: 1em 0;
  color: #6b7280;
  font-style: italic;
  background: #f9fafb;
  border-radius: 0 0.5em 0.5em 0;
  padding: 0.5em 1em;
}

.ai-markdown :deep(blockquote) {
  border-left-color: #3b82f6;
  background: #eff6ff;
}

.markdown-content :deep(hr) {
  border: none;
  border-top: 2px solid #e5e7eb;
  margin: 1.5em 0;
}

.markdown-content :deep(code:not(pre code)) {
  background: #f3f4f6;
  padding: 0.2em 0.4em;
  border-radius: 0.25em;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 0.85em;
  color: #e11d48;
}

.ai-markdown :deep(code:not(pre code)) {
  background: #dbeafe;
  color: #1e40af;
}

.markdown-content :deep(pre.code-block) {
  background: #1f2937;
  color: #f9fafb;
  padding: 1em;
  border-radius: 0.5em;
  overflow-x: auto;
  margin: 1em 0;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 0.85em;
  line-height: 1.4;
}

.markdown-content :deep(pre.code-block code) {
  background: none;
  padding: 0;
  color: inherit;
}

.markdown-content :deep(pre.code-block.code-block--unstable) {
  opacity: 0.92;
}

.markdown-content :deep(a) {
  color: #3b82f6;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s ease;
}

.markdown-content :deep(a:hover) {
  border-bottom-color: #3b82f6;
}

.ai-markdown :deep(a) {
  color: #1e40af;
}

.ai-markdown :deep(a:hover) {
  border-bottom-color: #1e40af;
}

.markdown-content :deep(strong) {
  font-weight: 600;
  color: #374151;
}

.ai-markdown :deep(strong) {
  color: #1e40af;
}

.markdown-content :deep(em) {
  font-style: italic;
  color: #6b7280;
}
</style>
