function getPageIdFromFilename() {
  const parts = window.location.pathname.split("/");
  const rawFileName = parts[parts.length - 1] || "";
  let fileName = rawFileName;
  try {
    fileName = decodeURIComponent(rawFileName);
  } catch (error) {
    fileName = rawFileName;
  }
  const match = fileName.match(/^(\d{3})(?:[\s_-].*)?\.html$/);
  return match ? match[1] : "";
}

function renderNewsDetailByPageId() {
  const pageId = getPageIdFromFilename();
  const article = gameData.newsArticles[pageId];
  const container = document.getElementById("newsContent");
  const titleEl = document.getElementById("newsTitle");
  const sourceEl = document.getElementById("newsSource");

  if (!container || !titleEl || !sourceEl) {
    return;
  }

  if (!article) {
    titleEl.textContent = "未找到该内容";
    sourceEl.textContent = "";
    container.innerHTML = '<p class="text-slate-500">当前页面暂无对应数据。</p>';
    return;
  }

  titleEl.textContent = article.title;
  sourceEl.textContent = article.source || "";
  container.innerHTML = "";

  article.blocks.forEach((block) => {
    if (block.type === "image") {
      const figure = document.createElement("figure");
      figure.className = "";

      const img = document.createElement("img");
      img.className = "w-full rounded-xl border border-slate-200 object-cover shadow-sm";
      img.src = block.imageSrc || "";
      img.alt = block.alt || "新闻配图";
      img.loading = "lazy";
      figure.appendChild(img);

      if (block.caption) {
        const caption = document.createElement("figcaption");
        caption.className = "";
        caption.innerHTML = block.caption;
        figure.appendChild(caption);
      }

      container.appendChild(figure);
      return;
    }

    if (block.type === "image-placeholder") {
      const figure = document.createElement("figure");
      figure.className = "rounded-xl border border-slate-200 bg-slate-50 p-4";
      figure.innerHTML = `
        <div class="flex h-48 items-center justify-center rounded-lg bg-slate-200 text-slate-500">${block.text}</div>
        <figcaption class="mt-2 text-xs text-slate-400">调研组现场参观照片（占位）</figcaption>
      `;
      container.appendChild(figure);
      return;
    }

    if (block.type === "signature") {
      const p = document.createElement("p");
      p.className = "prose-signature";
      p.innerHTML = block.text;
      container.appendChild(p);
      return;
    }

    const p = document.createElement("p");
    if (/^本报讯/.test(String(block.text || "").trim())) {
      p.className = "prose-lead";
    }
    p.innerHTML = block.text;
    container.appendChild(p);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderNewsDetailByPageId();
});

