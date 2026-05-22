(() => {
  const rawTitle = String(document.title || "").trim();
  if (rawTitle) {
    const titleMatch = rawTitle.match(/^(?:00[0-9]|01[0-8]|998)(?:[\s\-–—·:：]+)(.+)$/u);
    if (titleMatch && titleMatch[1].trim()) {
      document.title = titleMatch[1].trim();
    }
  }
})();

(() => {
  const STORAGE_KEY = "game_progress_stage";
  const WINDOW_STAGE_PREFIX = "__GAME_STAGE__:";
  const URL_STAGE_KEY = "gp";
  const VISUAL_BOOST_TRIGGERED_PAGES_KEY = "game_progress_visual_boost_triggered_pages";
  const DEBUG_RESET_BOOST_KEY = "debugResetBoost";
  /** 与 014 页 sessionStorage 一致：归档搜索已解锁 */
  const SHADOW_ARCHIVE_SESSION_KEY = "game014_shadow_archive_unlocked";
  /** 014 深层卷宗：已点开过的文件 id（持久化，可继续扩展权重表） */
  const SHADOW_FILES_VIEWED_KEY = "game014_shadow_files_viewed";
  /** 结局2 深层卷宗：四份关键文件各 25%（搜索命中即计，顺序不限；合计封顶 100 → 显示 200%） */
  const SHADOW_FILE_WEIGHTS = {
    "arc-120627": 25,
    "log-1336890": 25,
    "bm-316698": 25,
    "fd-678341": 25
  };
  /** 首次进入这些页面时弹出轻量提示（如官网 011、018 要闻）；不再使用右侧「隐藏进度条」；018 仅在主线未满 8（未进入结局1路径）时与 011 同款提示 */
  const SUBTLE_BOOST_PAGE_IDS = new Set(["011", "018"]);
  const LEGACY_VISUAL_BOOST_KEY = "game_progress_visual_boost";
  const LAST_INNER_FILL_KEY = "game_progress_last_inner_fill";
  let hiddenPageToastTimer = null;
  let progressStylesInjected = false;
  const BAR_BASE_MAX_WIDTH = 640;
  const BAR_VIEWPORT_RATIO = 0.92;
  const BAR_EDGE_GAP = 8;
  const STEP_PERCENT = [0, 12, 25, 38, 50, 63, 75, 88, 100];
  const STEP_LABELS = [
    "开始调查",
    "已打开 003 新闻2",
    "已打开 005 页面",
    "已登录林岚账号",
    "已进入林岚邮箱",
    "已进入林岚云笔记",
    "已登录张弛账号",
    "已修改文件",
    "已查看录音文件"
  ];
  const ACTION_STAGE_MAP = {
    open003: 1,
    open005: 2,
    loginLinlan: 3,
    enterLinlanMailbox: 4,
    enterLinlanCloudNote: 5,
    loginZhangchi: 6,
    modifyFile: 7,
    viewAudioRecord: 8
  };
  const PAGE_STAGE_MAP = {
    "003": 1,
    "005": 2
  };
  let mounted = false;

  function clampStage(value) {
    const num = Math.floor(Number(value) || 0);
    return Math.max(0, Math.min(8, num));
  }

  function readLocalStage() {
    try {
      return clampStage(localStorage.getItem(STORAGE_KEY) || "0");
    } catch (error) {
      return 0;
    }
  }

  function writeLocalStage(stage) {
    try {
      localStorage.setItem(STORAGE_KEY, String(clampStage(stage)));
    } catch (error) {
      // Ignore write failures in restricted contexts (e.g. some file:// policies).
    }
  }

  function readLastInnerFill() {
    try {
      const value = Number(localStorage.getItem(LAST_INNER_FILL_KEY));
      return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
    } catch (error) {
      return 0;
    }
  }

  function writeLastInnerFill(percent) {
    try {
      const safe = Math.max(0, Math.min(100, Number(percent) || 0));
      localStorage.setItem(LAST_INNER_FILL_KEY, String(safe));
    } catch (error) {
      // Ignore write failures in restricted contexts.
    }
  }

  function injectProgressBarStyles() {
    if (progressStylesInjected || document.getElementById("game-progress-ui-styles")) {
      progressStylesInjected = true;
      return;
    }
    const style = document.createElement("style");
    style.id = "game-progress-ui-styles";
    style.textContent = `
      #game-hidden-page-toast {
        transition: opacity 0.28s ease, transform 0.28s ease;
      }
    `;
    document.head.appendChild(style);
    progressStylesInjected = true;
  }

  function showHiddenPageToast(message) {
    injectProgressBarStyles();
    let el = document.getElementById("game-hidden-page-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "game-hidden-page-toast";
      el.setAttribute("role", "status");
      el.className =
        "pointer-events-none fixed left-1/2 top-[4.5rem] z-[125] max-w-[min(90vw,20rem)] -translate-x-1/2 rounded-lg border border-slate-600/80 bg-slate-900/92 px-4 py-2.5 text-center text-sm leading-snug text-slate-50 shadow-lg opacity-0";
      document.body.appendChild(el);
    }
    el.textContent = message;
    window.requestAnimationFrame(() => {
      el.style.opacity = "1";
    });
    if (hiddenPageToastTimer) {
      window.clearTimeout(hiddenPageToastTimer);
    }
    hiddenPageToastTimer = window.setTimeout(() => {
      el.style.opacity = "0";
      hiddenPageToastTimer = null;
    }, 2600);
  }

  function isShadowArchiveSessionUnlocked() {
    try {
      return sessionStorage.getItem(SHADOW_ARCHIVE_SESSION_KEY) === "1";
    } catch (error) {
      return false;
    }
  }

  function is014ShadowSearchContext() {
    return getPageId() === "014" && isShadowArchiveSessionUnlocked();
  }

  /** 015：结局2正式后续页；深层卷宗满额时与 014 共用双段进度算法（显示最高 200%） */
  function isEnding2FollowupPage() {
    return getPageId() === "015";
  }

  /** 与 014 深层卷宗一致的「双段进度」UI（主线 100% + 隐藏段 100% → 显示最高 200%） */
  function usesShadowDualProgressDisplay() {
    return is014ShadowSearchContext() || isEnding2FollowupPage();
  }

  function readShadowFilesViewed() {
    try {
      const raw = localStorage.getItem(SHADOW_FILES_VIEWED_KEY) || "[]";
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) {
        return new Set();
      }
      return new Set(list.map((value) => String(value || "").trim()).filter(Boolean));
    } catch (error) {
      return new Set();
    }
  }

  function writeShadowFilesViewed(idSet) {
    try {
      localStorage.setItem(SHADOW_FILES_VIEWED_KEY, JSON.stringify(Array.from(idSet)));
    } catch (error) {
      // Ignore write failures.
    }
  }

  function getShadowBonusPercent() {
    if (isEnding2FollowupPage()) {
      return 100;
    }
    const viewed = readShadowFilesViewed();
    let sum = 0;
    viewed.forEach((id) => {
      const w = SHADOW_FILE_WEIGHTS[id];
      if (typeof w === "number") {
        sum += w;
      }
    });
    return Math.min(100, sum);
  }

  function markShadowArchiveMilestone(fileId) {
    const id = String(fileId || "").trim();
    if (!id || !(id in SHADOW_FILE_WEIGHTS)) {
      return getShadowBonusPercent();
    }
    const bonusBefore = getShadowBonusPercent();
    const viewed = readShadowFilesViewed();
    if (viewed.has(id)) {
      return bonusBefore;
    }
    viewed.add(id);
    writeShadowFilesViewed(viewed);
    const bonusAfter = getShadowBonusPercent();
    refreshProgressUI({ animate: bonusAfter > bonusBefore });
    return bonusAfter;
  }

  /** 014：用户通过关键词搜索使该文件首次出现在结果列表时调用 */
  function markShadowArchiveFileSearched(fileId) {
    return markShadowArchiveMilestone(fileId);
  }

  /** 兼容旧调用：进度仅由「搜索命中」累计，打开预览不再写入里程碑 */
  function markShadowArchiveFileOpened() {
    return getShadowBonusPercent();
  }

  function getBaseBarWidth() {
    const viewportWidth = Math.max(320, window.innerWidth || 0);
    return Math.min(Math.floor(viewportWidth * BAR_VIEWPORT_RATIO), BAR_BASE_MAX_WIDTH);
  }

  function syncBodyProgressPadding() {
    if (isInitialPage()) {
      return;
    }
    const host = document.getElementById("globalProgressBar");
    if (!host) {
      return;
    }
    const bottom = host.getBoundingClientRect().bottom;
    const gap = 10;
    document.body.style.paddingTop = `${Math.ceil(bottom + gap)}px`;
  }

  function applyBarWidth() {
    const host = document.getElementById("globalProgressBar");
    if (!host) {
      return;
    }
    const baseWidth = getBaseBarWidth();
    const viewportWidth = Math.max(320, window.innerWidth || 0);
    const maxUsableWidth = Math.max(280, viewportWidth - BAR_EDGE_GAP * 2);
    const width = Math.min(baseWidth, maxUsableWidth);
    const left = Math.max(BAR_EDGE_GAP, Math.floor((viewportWidth - baseWidth) / 2));
    host.style.width = `${width}px`;
    host.style.left = `${left}px`;
    host.style.transform = "";
  }

  function readTriggeredBoostPages() {
    try {
      const raw = localStorage.getItem(VISUAL_BOOST_TRIGGERED_PAGES_KEY) || "[]";
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) {
        return new Set();
      }
      return new Set(
        list
          .map((value) => String(value || "").trim())
          .filter((value) => /^\d{3}$/.test(value))
      );
    } catch (error) {
      return new Set();
    }
  }

  function writeTriggeredBoostPages(pageSet) {
    try {
      localStorage.setItem(VISUAL_BOOST_TRIGGERED_PAGES_KEY, JSON.stringify(Array.from(pageSet)));
    } catch (error) {
      // Ignore write failures in restricted contexts.
    }
  }

  function markBoostTriggered(pageId) {
    const safePageId = String(pageId || "").trim();
    if (!/^\d{3}$/.test(safePageId)) {
      return false;
    }
    const triggered = readTriggeredBoostPages();
    if (triggered.has(safePageId)) {
      return false;
    }
    triggered.add(safePageId);
    writeTriggeredBoostPages(triggered);
    return true;
  }

  function readWindowStage() {
    const raw = String(window.name || "");
    const markerIndex = raw.indexOf(WINDOW_STAGE_PREFIX);
    if (markerIndex < 0) {
      return 0;
    }
    const stageText = raw.slice(markerIndex + WINDOW_STAGE_PREFIX.length).split("|")[0];
    return clampStage(stageText);
  }

  function writeWindowStage(stage) {
    const safeStage = clampStage(stage);
    const raw = String(window.name || "");
    const markerIndex = raw.indexOf(WINDOW_STAGE_PREFIX);
    const nextMarker = `${WINDOW_STAGE_PREFIX}${safeStage}|`;
    if (markerIndex < 0) {
      window.name = raw ? `${raw}|${nextMarker}` : nextMarker;
      return;
    }
    const before = raw.slice(0, markerIndex);
    const rest = raw.slice(markerIndex + WINDOW_STAGE_PREFIX.length);
    const suffix = rest.includes("|") ? rest.slice(rest.indexOf("|") + 1) : "";
    window.name = `${before}${nextMarker}${suffix}`.replace(/^\|+|\|+$/g, "");
  }

  function readUrlStage() {
    try {
      const url = new URL(window.location.href);
      return clampStage(url.searchParams.get(URL_STAGE_KEY) || "0");
    } catch (error) {
      return 0;
    }
  }

  function syncStageToUrl(stage) {
    try {
      const safeStage = clampStage(stage);
      const url = new URL(window.location.href);
      if (clampStage(url.searchParams.get(URL_STAGE_KEY) || "0") === safeStage) {
        return;
      }
      url.searchParams.set(URL_STAGE_KEY, String(safeStage));
      window.history.replaceState(null, "", url.toString());
    } catch (error) {
      // Ignore URL sync failure.
    }
  }

  function appendStageToHref(rawHref, stage) {
    if (!rawHref) {
      return rawHref;
    }
    const lowered = rawHref.trim().toLowerCase();
    if (
      !lowered ||
      lowered.startsWith("#") ||
      lowered.startsWith("javascript:") ||
      lowered.startsWith("mailto:") ||
      lowered.startsWith("tel:")
    ) {
      return rawHref;
    }
    try {
      const safeStage = clampStage(stage);
      const url = new URL(rawHref, window.location.href);
      if (!/\.html(?:$|\?)/i.test(url.pathname + url.search)) {
        return rawHref;
      }
      if (url.searchParams.has(URL_STAGE_KEY)) {
        const existing = clampStage(url.searchParams.get(URL_STAGE_KEY) || "0");
        url.searchParams.set(URL_STAGE_KEY, String(Math.max(existing, safeStage)));
      } else {
        url.searchParams.set(URL_STAGE_KEY, String(safeStage));
      }
      return url.toString();
    } catch (error) {
      return rawHref;
    }
  }

  function bindLinkStagePropagation() {
    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }
      const href = anchor.getAttribute("href") || "";
      const nextHref = appendStageToHref(href, getCurrentStage());
      if (nextHref && nextHref !== href) {
        anchor.setAttribute("href", nextHref);
      }
    });
  }

  function getCurrentStage() {
    const localStage = readLocalStage();
    const windowStage = readWindowStage();
    const urlStage = readUrlStage();
    return Math.max(localStage, windowStage, urlStage);
  }

  function setStage(nextStage, options = {}) {
    const current = getCurrentStage();
    const normalized = clampStage(nextStage);
    const safeStage = Math.max(current, normalized);
    const didIncrease = safeStage > current;
    writeLocalStage(safeStage);
    writeWindowStage(safeStage);
    syncStageToUrl(safeStage);
    if (options.refresh !== false) {
      refreshProgressUI({ animate: options.animate ?? didIncrease });
    }
    return safeStage;
  }

  function markAction(actionKey) {
    const target = ACTION_STAGE_MAP[actionKey];
    if (!target) {
      return getCurrentStage();
    }
    return setStage(target);
  }

  function getFileName() {
    let pathname = String(window.location.pathname || "").replace(/\\/g, "/");
    const segments = pathname.split("/");
    let rawFileName = segments[segments.length - 1] || "";
    if (!rawFileName || !/\.html/i.test(rawFileName)) {
      const href = String(window.location.href || "");
      const fromHref = href.match(/([^/?#]+\.html)(?:[?#]|$)/i);
      if (fromHref) {
        rawFileName = fromHref[1];
      }
    }
    try {
      return decodeURIComponent(rawFileName);
    } catch (error) {
      return rawFileName;
    }
  }

  function getPageId() {
    const fileName = getFileName();
    if (fileName === "index.html") {
      return "000";
    }
    const match = fileName.match(/^(\d{3})(?:[\s_-].*)?\.html$/);
    return match ? match[1] : "";
  }

  function isInitialPage() {
    const fileName = getFileName();
    return fileName === "index.html";
  }

  function maybeResetVisualBoostForDebug() {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get(DEBUG_RESET_BOOST_KEY) !== "1") {
        return;
      }
      localStorage.removeItem(LEGACY_VISUAL_BOOST_KEY);
      localStorage.removeItem(VISUAL_BOOST_TRIGGERED_PAGES_KEY);
      url.searchParams.delete(DEBUG_RESET_BOOST_KEY);
      window.history.replaceState(null, "", url.toString());
    } catch (error) {
      // Ignore debug reset failure.
    }
  }

  /** 013：结局1报案页不挂载顶部探索进度条（与 015 沉浸收束一致） */
  function isEnding1ReportPage() {
    return getPageId() === "013";
  }

  function ensureProgressBar() {
    /** 015：结局2后续正式页不挂载顶部探索进度条 */
    if (mounted || isInitialPage() || isEnding2FollowupPage() || isEnding1ReportPage()) {
      return;
    }
    injectProgressBarStyles();
    const barHost = document.createElement("div");
    barHost.id = "globalProgressBar";
    barHost.className =
      "fixed top-3 rounded-xl border border-blue-200/70 bg-white/95 px-3 py-2 shadow-md backdrop-blur transition-[width] ease-out";
    /** 高于 014 封停/终端/归档全屏层 (z≈88–100)，避免进度条被挡住 */
    barHost.style.zIndex = "120";
    barHost.style.transitionDuration = "1800ms";
    barHost.style.transitionTimingFunction = "cubic-bezier(0.22, 1, 0.36, 1)";
    barHost.innerHTML = `
      <div class="mb-1 flex items-center justify-between text-xs">
        <span class="font-semibold text-slate-700">探索进度</span>
        <span id="globalProgressText" class="text-blue-600">0%</span>
      </div>
      <div id="globalProgressStretchShell" class="flex w-full flex-col gap-1 overflow-visible">
        <div class="flex w-full min-h-[10px] items-center overflow-visible">
          <div id="globalProgressMainTrack" class="relative h-2.5 min-w-0 w-full shrink overflow-hidden rounded-full border border-blue-200/60 bg-blue-100/95 transition-[background,border-radius] duration-300">
            <div id="globalProgressScaleTick" class="pointer-events-none absolute left-1/2 top-0 z-10 hidden h-full w-px -translate-x-1/2 bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.6)]" aria-hidden="true"></div>
            <div id="globalProgressInner" class="relative z-[1] h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-[width] duration-700 ease-out" style="width:0%;"></div>
          </div>
        </div>
      </div>
      <p id="globalProgress011HiddenHint" class="hidden mt-1.5 border-t border-amber-200/70 pt-1.5 text-center text-[11px] font-medium leading-snug text-amber-700"></p>
    `;
    document.body.appendChild(barHost);
    applyBarWidth();
    syncBodyProgressPadding();
    window.addEventListener("resize", () => {
      applyBarWidth();
      syncBodyProgressPadding();
    });
    mounted = true;
  }

  function refreshProgressUI(options = {}) {
    const { animate = false } = options;
    const stage = getCurrentStage();
    const mainPercent = STEP_PERCENT[stage] || 0;
    const shadowDualMode = usesShadowDualProgressDisplay();
    const shadowBonus = shadowDualMode ? getShadowBonusPercent() : 0;
    const displayPercent = shadowDualMode ? 100 + shadowBonus : mainPercent;
    const innerFillPercent = shadowDualMode ? displayPercent / 2 : mainPercent;
    const textEl = document.getElementById("globalProgressText");
    const innerEl = document.getElementById("globalProgressInner");
    const tickEl = document.getElementById("globalProgressScaleTick");
    const mainTrack = document.getElementById("globalProgressMainTrack");
    applyBarWidth();
    if (textEl) {
      textEl.textContent = `${displayPercent}%`;
    }
    if (innerEl) {
      const duration = shadowDualMode ? "900ms" : "700ms";
      const timing = shadowDualMode
        ? "cubic-bezier(0.22, 1, 0.36, 1)"
        : "cubic-bezier(0.4, 0, 0.2, 1)";
      if (animate) {
        const startFill = readLastInnerFill();
        innerEl.style.transition = "none";
        innerEl.style.width = `${startFill}%`;
        void innerEl.offsetWidth;
        innerEl.style.transition = "";
        innerEl.style.transitionProperty = "width";
        innerEl.style.transitionDuration = duration;
        innerEl.style.transitionTimingFunction = timing;
        innerEl.style.width = `${innerFillPercent}%`;
      } else {
        innerEl.style.transition = "none";
        innerEl.style.width = `${innerFillPercent}%`;
        void innerEl.offsetWidth;
        innerEl.style.transition = "";
        innerEl.style.transitionProperty = "width";
        innerEl.style.transitionDuration = duration;
        innerEl.style.transitionTimingFunction = timing;
      }
      writeLastInnerFill(innerFillPercent);
    }
    if (tickEl) {
      if (shadowDualMode) {
        tickEl.classList.remove("hidden");
      } else {
        tickEl.classList.add("hidden");
      }
    }
    if (mainTrack) {
      mainTrack.classList.remove("rounded-l-lg", "rounded-r-none");
      mainTrack.classList.add("rounded-full");
      if (shadowDualMode) {
        mainTrack.classList.remove("border-blue-200/60", "bg-blue-100/95");
        mainTrack.classList.add(
          "border-blue-300/50",
          "bg-gradient-to-r",
          "from-blue-100",
          "via-blue-100",
          "to-blue-200/90"
        );
      } else {
        mainTrack.classList.remove(
          "border-blue-300/50",
          "bg-gradient-to-r",
          "from-blue-100",
          "via-blue-100",
          "to-blue-200/90"
        );
        mainTrack.classList.add("border-blue-200/60", "bg-blue-100/95");
      }
    }
    const hint011 = document.getElementById("globalProgress011HiddenHint");
    if (hint011) {
      const pageId = getPageId();
      const showHiddenHint =
        pageId === "011" || (pageId === "018" && stage < 8);
      if (showHiddenHint) {
        hint011.textContent = "发现隐藏内容";
        hint011.classList.remove("hidden");
      } else {
        hint011.textContent = "";
        hint011.classList.add("hidden");
      }
    }
    window.requestAnimationFrame(() => syncBodyProgressPadding());
  }

  function autoMarkPageStep() {
    const pageId = getPageId();
    const target = PAGE_STAGE_MAP[pageId];
    if (target) {
      setStage(target);
    }
    const fileName = getFileName();
    if (
      fileName === "010-notes-linlan.html" &&
      localStorage.getItem("oa_current_user") === "linlan"
    ) {
      markAction("enterLinlanCloudNote");
    }

    const stage = getCurrentStage();
    if (stage < 8 && SUBTLE_BOOST_PAGE_IDS.has(pageId) && markBoostTriggered(pageId)) {
      if (pageId !== "011" && pageId !== "018") {
        showHiddenPageToast("发现隐藏内容!");
      }
    }
  }

  /**
   * 线上部署时若漏传图片目录或大小写不一致，img 会 404。为本地相对路径配图绑定一次性 error 提示，
   * 并用 MutationObserver 覆盖 innerHTML 动态插入的图片（如云笔记）。
   */
  function installLocalImageDeployGuards() {
    const GUARD_ATTR = "dataDeployImgGuard";

    function bindImg(img) {
      if (!img || img.nodeType !== 1 || img.tagName !== "IMG") {
        return;
      }
      if (img.getAttribute(GUARD_ATTR) === "1") {
        return;
      }
      img.setAttribute(GUARD_ATTR, "1");
      img.addEventListener(
        "error",
        () => {
          if (img.getAttribute("dataDeployImgFailed") === "1") {
            return;
          }
          const raw = String(img.getAttribute("src") || "").trim();
          if (!raw || /^https?:\/\//i.test(raw) || /^data:/i.test(raw)) {
            return;
          }
          img.setAttribute("dataDeployImgFailed", "1");
          const tip = document.createElement("p");
          tip.className =
            "mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800";
          tip.setAttribute("role", "status");
          tip.textContent =
            "本地配图未能加载。发布到网站时请把 images、assets、media、downloads 等资源文件夹与所有网页放在同一目录层级一并上传，路径与文件名（含大小写）需与本机一致。";
          const fig = img.closest("figure");
          if (fig) {
            fig.appendChild(tip);
          } else {
            img.insertAdjacentElement("afterend", tip);
          }
          img.style.display = "none";
        },
        { once: true }
      );
    }

    function scan(root) {
      if (!root || typeof root.querySelectorAll !== "function") {
        return;
      }
      root.querySelectorAll("img[src]").forEach(bindImg);
    }

    scan(document);
    if (!document.body) {
      return;
    }
    const mo = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) {
            return;
          }
          if (node.tagName === "IMG") {
            bindImg(node);
          }
          scan(node);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    window.requestAnimationFrame(() => {
      scan(document);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    maybeResetVisualBoostForDebug();
    const stageBeforeVisit = getCurrentStage();
    setStage(getCurrentStage(), { refresh: false });
    ensureProgressBar();
    bindLinkStagePropagation();
    autoMarkPageStep();
    const stageAfterVisit = getCurrentStage();
    const stageIncreasedOnVisit = stageAfterVisit > stageBeforeVisit;
    if (!stageIncreasedOnVisit) {
      refreshProgressUI({ animate: false });
    }
    installLocalImageDeployGuards();
  });

  window.GameProgressTracker = {
    getStage: getCurrentStage,
    setStage,
    markAction,
    markShadowArchiveFileOpened,
    markShadowArchiveFileSearched,
    getShadowBonusPercent,
    refreshProgressUI,
    resolveUrlWithStage: (rawHref) => appendStageToHref(rawHref, getCurrentStage())
  };
})();
