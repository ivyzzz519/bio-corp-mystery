/**
 * 将纯文本或 HTML 段落格式化为书籍式排版（配合 .prose-article）。
 */
function formatPlainTextToProseHtml(raw) {
  const text = String(raw || "").trim();
  if (!text) {
    return "";
  }
  return text
    .split(/\n\s*\n+/)
    .map((block) => {
      const para = block.replace(/\n+/g, "").trim();
      if (!para) {
        return "";
      }
      const safe = para
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `<p>${safe}</p>`;
    })
    .filter(Boolean)
    .join("");
}

window.ProseArticle = {
  formatPlainTextToProseHtml
};
