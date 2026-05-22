// Runtime state to prevent duplicate triggering
const gameState = {
  discoveredKeywords: new Set(),
  unlockedPages: new Set(["001"])
};

function normalizeKeyword(keyword) {
  return String(keyword || "")
    .trim()
    .replace(/\s+/g, " ");
}

function setSearch404Overlay(show, message) {
  const host = document.body;
  if (!host) {
    return;
  }
  let el = document.getElementById("search404Overlay");
  if (show) {
    if (!el) {
      el = document.createElement("div");
      el.id = "search404Overlay";
      el.className =
        "hidden fixed inset-0 z-[9999] flex items-center justify-center bg-black px-6 text-center font-mono text-lg text-white sm:text-xl";
      el.setAttribute("role", "status");
      host.appendChild(el);
    }
    el.textContent = message || "404 NOT FOUND";
    el.classList.remove("hidden");
    document.documentElement.classList.add("overflow-hidden");
    host.classList.add("overflow-hidden");
  } else {
    if (el) {
      el.classList.add("hidden");
    }
    document.documentElement.classList.remove("overflow-hidden");
    host.classList.remove("overflow-hidden");
  }
}

function getSearchPayload(keyword) {
  const normalized = normalizeKeyword(keyword);
  if (!normalized) {
    return {
      ok: false,
      keyword: "",
      resultCount: 0,
      results: [],
      message: "请输入关键词。",
      isDuplicate: false
    };
  }

  const deniedMessage = gameData.deniedKeywords
    ? gameData.deniedKeywords[normalized]
    : "";
  if (deniedMessage) {
    return {
      ok: false,
      keyword: normalized,
      resultCount: 0,
      results: [],
      message: deniedMessage,
      isDuplicate: false,
      blackScreen: deniedMessage === "404 NOT FOUND"
    };
  }

  const aliases = gameData.searchKeywordAliases || {};
  const indexKey = aliases[normalized] || normalized;
  const record = gameData.searchIndex[indexKey];
  if (!record) {
    return {
      ok: false,
      keyword: normalized,
      resultCount: 0,
      results: [],
      message: "无搜索结果",
      isDuplicate: false
    };
  }

  const isDuplicate = gameState.discoveredKeywords.has(indexKey);
  if (!isDuplicate) {
    gameState.discoveredKeywords.add(indexKey);
    record.results.forEach((item) => {
      if (item.unlockNewPage && item.unlockedPageId) {
        gameState.unlockedPages.add(item.unlockedPageId);
      }
    });
  }

  return {
    ok: true,
    keyword: normalized,
    resultCount: record.resultCount,
    results: record.results,
    message: "",
    isDuplicate
  };
}

function resolveSearchDesk() {
  if (window.OaWorkbenchNav) {
    const pathDesk = window.OaWorkbenchNav.detectDeskFromPathname();
    if (pathDesk) {
      window.OaWorkbenchNav.persistDesk(pathDesk);
    }
    return window.OaWorkbenchNav.getActiveDesk();
  }
  return localStorage.getItem("oa_current_user") || "linmin";
}

function appendDeskToPageUrl(url) {
  if (!url) {
    return url;
  }
  const desk = resolveSearchDesk();
  if (window.OaWorkbenchNav) {
    return window.OaWorkbenchNav.appendDeskParam(url, desk);
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}desk=${encodeURIComponent(desk)}`;
}

function renderSearchResults(payload) {
  const resultCountEl = document.getElementById("resultCount");
  const resultListEl = document.getElementById("resultList");
  const resultHintEl = document.getElementById("resultHint");

  if (!resultCountEl || !resultListEl || !resultHintEl) {
    return;
  }

  resultListEl.innerHTML = "";

  if (!payload.ok) {
    setSearch404Overlay(Boolean(payload.blackScreen), payload.message);
    resultCountEl.textContent = "显示0条搜索结果";
    resultHintEl.textContent = payload.blackScreen ? "" : payload.message;
    return;
  }

  setSearch404Overlay(false);
  resultCountEl.textContent = `显示${payload.resultCount}条搜索结果`;
  resultHintEl.textContent = payload.isDuplicate
    ? "该关键词已检索过，以下为已解锁信息。"
    : "检索成功，发现新线索。";

  payload.results.forEach((item) => {
    const card = document.createElement(item.targetPage ? "a" : "div");
    card.className =
      "rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm";
    if (item.targetPage) {
      card.href = appendDeskToPageUrl(item.targetPage);
      card.classList.add("block", "hover:bg-slate-50");
    }
    card.innerHTML = `<h3 class="text-sm font-semibold text-slate-800">${item.title}</h3>`;
    resultListEl.appendChild(card);
  });
}

function handleSearch(keyword) {
  const payload = getSearchPayload(keyword);
  const hasSearchResultContainer = Boolean(
    document.getElementById("resultCount") &&
      document.getElementById("resultList") &&
      document.getElementById("resultHint")
  );

  if (hasSearchResultContainer) {
    renderSearchResults(payload);
  } else {
    const desk = resolveSearchDesk();
    const targetKeyword = encodeURIComponent(normalizeKeyword(keyword));
    const targetUrl = `./search.html?keyword=${targetKeyword}&desk=${encodeURIComponent(desk)}`;
    window.location.href = window.GameProgressTracker
      ? window.GameProgressTracker.resolveUrlWithStage(targetUrl)
      : targetUrl;
  }

  return payload;
}

function bindSearchEvents() {
  const inputEl = document.getElementById("oaSearchInput");
  const buttonEl = document.getElementById("oaSearchButton");
  if (!inputEl || !buttonEl) {
    return;
  }

  const trigger = () => {
    handleSearch(inputEl.value);
  };

  buttonEl.addEventListener("click", trigger);
  inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      trigger();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindSearchEvents();

  const isSearchPage = Boolean(
    document.getElementById("resultCount") &&
      document.getElementById("resultList") &&
      document.getElementById("resultHint")
  );
  if (!isSearchPage) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  if (window.OaWorkbenchNav) {
    window.OaWorkbenchNav.getActiveDesk();
  }
  const keyword = params.get("keyword") || "";
  const inputEl = document.getElementById("oaSearchInput");
  if (inputEl) {
    inputEl.value = keyword;
  }
  renderSearchResults(getSearchPayload(keyword));
});

