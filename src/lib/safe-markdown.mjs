import { marked, Renderer } from "marked";

const renderer = new Renderer();
renderer.html = () => "";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function safeHref(value) {
  if (typeof value !== "string" || /[\u0000-\u001f\\]/.test(value)) return undefined;
  const href = value.trim();
  if (!href || href.startsWith("//")) return undefined;
  if (href.startsWith("/") || href.startsWith("#") || href.startsWith("./") || href.startsWith("../")) return href;
  try {
    const url = new URL(href);
    if (!["https:", "http:", "mailto:"].includes(url.protocol) || url.username || url.password) return undefined;
    return href;
  } catch {
    return undefined;
  }
}

renderer.link = function (token) {
  const content = this.parser.parseInline(token.tokens);
  const href = safeHref(token.href);
  if (!href) return content;
  const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
  return `<a href="${escapeHtml(href)}"${title}>${content}</a>`;
};

renderer.image = function (token) {
  const src = typeof token.href === "string" && token.href.startsWith("/") && !token.href.startsWith("//") && !token.href.includes("\\")
    ? token.href
    : undefined;
  if (!src) return escapeHtml(token.text);
  const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
  return `<img src="${escapeHtml(src)}" alt="${escapeHtml(token.text)}"${title}>`;
};

/** Render Markdown while suppressing raw HTML and restricting links and images. */
export function renderSafeMarkdown(source) {
  return marked.parse(source, { async: false, gfm: true, renderer });
}
