/**
 * 去掉浏览器标签标题里用于内部路由的页码前缀（000–018、998），
 * 仅当「三位页码 + 分隔符 + 正文」时才改写，避免误伤「2000年」等。
 */
(function () {
  function stripLeadingPageCode(title) {
    var t = String(title || "").trim();
    if (!t) return title;
    var m = t.match(/^(?:00[0-9]|01[0-8]|998)(?:[\s\-–—·:：]+)(.+)$/u);
    if (m && m[1]) {
      var rest = m[1].trim();
      if (rest.length) return rest;
    }
    return title;
  }

  function apply() {
    var next = stripLeadingPageCode(document.title);
    if (next !== document.title) document.title = next;
  }

  apply();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }
})();
