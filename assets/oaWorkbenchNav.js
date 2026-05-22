(function () {
  const deskKey = "oa_workbench_desk";
  const legacyUserKey = "oa_current_user";

  function detectDeskFromPathname() {
    const file = decodeURIComponent(
      (window.location.pathname.split("/").pop() || "").toLowerCase()
    );
    if (file.includes("012-desk-zhangchi") || /^012/.test(file)) {
      return "zhangchi";
    }
    if (file.includes("007-desk-linlan") || /^007/.test(file)) {
      return "linlan";
    }
    if (file.includes("001-oa-home") || /^001/.test(file)) {
      return "linmin";
    }
    return "";
  }

  function readDeskFromUrl() {
    const desk = new URLSearchParams(window.location.search).get("desk") || "";
    if (desk === "zhangchi" || desk === "linlan" || desk === "linmin") {
      return desk;
    }
    return "";
  }

  function persistDesk(desk) {
    if (desk !== "zhangchi" && desk !== "linlan" && desk !== "linmin") {
      return;
    }
    sessionStorage.setItem(deskKey, desk);
    localStorage.setItem(legacyUserKey, desk);
  }

  function getActiveDesk() {
    const fromUrl = readDeskFromUrl();
    if (fromUrl) {
      persistDesk(fromUrl);
      return fromUrl;
    }
    const fromPath = detectDeskFromPathname();
    if (fromPath) {
      persistDesk(fromPath);
      return fromPath;
    }
    const stored =
      sessionStorage.getItem(deskKey) ||
      localStorage.getItem(legacyUserKey) ||
      "";
    if (stored === "zhangchi" || stored === "linlan" || stored === "linmin") {
      return stored;
    }
    return "linmin";
  }

  function getOaWorkbenchUrl(desk) {
    const key = desk || getActiveDesk();
    if (key === "zhangchi") {
      return "./012-desk-zhangchi.html";
    }
    if (key === "linlan") {
      return "./007-desk-linlan.html";
    }
    return "./001-oa-home.html";
  }

  function appendDeskParam(url, desk) {
    if (!url || !desk) {
      return url;
    }
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}desk=${encodeURIComponent(desk)}`;
  }

  function bindBackToWorkbenchLink() {
    const link = document.getElementById("backToWorkbenchLink");
    if (!link) {
      return;
    }
    const url = getOaWorkbenchUrl();
    link.href = window.GameProgressTracker
      ? window.GameProgressTracker.resolveUrlWithStage(url)
      : url;
  }

  window.OaWorkbenchNav = {
    detectDeskFromPathname,
    readDeskFromUrl,
    persistDesk,
    getActiveDesk,
    getOaWorkbenchUrl,
    appendDeskParam,
    bindBackToWorkbenchLink
  };

  document.addEventListener("DOMContentLoaded", () => {
    getActiveDesk();
    bindBackToWorkbenchLink();
  });
})();
