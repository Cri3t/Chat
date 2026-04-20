import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import plaintext from "highlight.js/lib/languages/plaintext";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import MarkdownIt from "markdown-it";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("plaintext", plaintext);
hljs.registerLanguage("text", plaintext);
hljs.registerLanguage("txt", plaintext);
hljs.registerLanguage("python", python);
hljs.registerLanguage("py", python);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);

export type UnstableTailMode = "plain" | "inline";

export type MarkdownSegments = {
  stableContent: string;
  unstableTail: string;
  hasUnclosedFence: boolean;
};

function escapeHtml(content: string): string {
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const markdownIt = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: false,
  highlight(code, language) {
    const normalizedLanguage = language.trim().toLowerCase();

    if (normalizedLanguage && hljs.getLanguage(normalizedLanguage)) {
      return `<pre class="code-block hljs"><code class="hljs language-${normalizedLanguage}">${
        hljs.highlight(code, {
          language: normalizedLanguage,
          ignoreIllegals: true,
        }).value
      }</code></pre>`;
    }

    return `<pre class="code-block hljs"><code class="hljs language-text">${escapeHtml(code)}</code></pre>`;
  },
});

function unwrapMarkdownFence(content: string): string {
  const normalized = content.replace(/\r\n/g, "\n");
  const openingFence = normalized.match(/^\s*(`{3,}|~{3,})\s*(markdown|md)\s*\n/i);

  if (!openingFence) {
    return normalized;
  }

  const fenceMarker = openingFence[1] ?? "";
  const fenceCharacter = fenceMarker.charAt(0);
  const fenceLength = fenceMarker.length;
  const body = normalized.slice(openingFence[0].length);
  const closingFencePattern = new RegExp(
    `\\n[ \\t]*[${fenceCharacter}]{${fenceLength},}[ \\t]*$`,
  );

  return body.replace(closingFencePattern, "");
}

const defaultLinkOpen =
  markdownIt.renderer.rules.link_open ??
  ((tokens, idx, options, _env, self) =>
    self.renderToken(tokens, idx, options));

markdownIt.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];

  token?.attrSet("target", "_blank");
  token?.attrSet("rel", "noopener noreferrer");

  return defaultLinkOpen(tokens, idx, options, env, self);
};

export function splitMarkdownForStreaming(content: string): MarkdownSegments {
  const normalized = unwrapMarkdownFence(content);
  const lines = normalized.split("\n");

  let insideFence = false;
  let fenceCharacter = "";
  let unstableStartIndex = lines.length;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const fenceMatch = line?.match(/^(\s*)(`{3,}|~{3,})(.*)$/);

    if (!fenceMatch) {
      continue;
    }

    const marker = fenceMatch[2] ?? "";
    const markerCharacter = marker.charAt(0);

    if (!insideFence) {
      insideFence = true;
      fenceCharacter = markerCharacter;
      unstableStartIndex = i;
      continue;
    }

    if (markerCharacter === fenceCharacter) {
      insideFence = false;
      fenceCharacter = "";
      unstableStartIndex = lines.length;
    }
  }

  if (!insideFence) {
    return {
      stableContent: normalized,
      unstableTail: "",
      hasUnclosedFence: false,
    };
  }

  return {
    stableContent: lines.slice(0, unstableStartIndex).join("\n"),
    unstableTail: lines.slice(unstableStartIndex).join("\n"),
    hasUnclosedFence: true,
  };
}

export function renderMarkdown(content: string): string {
  const normalized = unwrapMarkdownFence(content);

  if (!normalized.trim()) {
    return "";
  }

  return markdownIt.render(normalized);
}

export function renderInlineMarkdown(content: string): string {
  const normalized = unwrapMarkdownFence(content);

  if (!normalized.trim()) {
    return "";
  }

  return `<p>${markdownIt.renderInline(normalized)}</p>`;
}

export function renderUnstableTail(
  content: string,
  mode: UnstableTailMode,
): string {
  if (!content) {
    return "";
  }

  const codeContent =
    mode === "inline"
      ? content.replace(/^(\s*)(`{3,}|~{3,})[^\n]*\n?/, "")
      : content;

  return `<pre class="code-block code-block--unstable hljs"><code class="hljs language-text">${escapeHtml(codeContent)}</code></pre>`;
}
