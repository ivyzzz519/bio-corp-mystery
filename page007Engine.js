function bind007DisabledActions() {
  const hintEl = document.getElementById("disabledHint");
  const disabledButtons = document.querySelectorAll("[data-disabled]");

  disabledButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!hintEl) {
        return;
      }
      const message = button.getAttribute("data-disabled") || "已被禁用";
      hintEl.textContent = message;
      hintEl.classList.remove("hidden");
    });
  });
}

function bind007AuthMenu() {
  const accountButton = document.getElementById("accountButton");
  const accountMenu = document.getElementById("accountMenu");
  const accountAvatar = document.getElementById("accountAvatar");
  const accountName = document.getElementById("accountName");
  const accountSubtitle = document.getElementById("accountSubtitle");
  const logoutButton = document.getElementById("logoutButton");
  const loginButton = document.getElementById("loginButton");
  const loginModal = document.getElementById("loginModal");
  const loginCloseButton = document.getElementById("loginCloseButton");
  const loginAccountInput = document.getElementById("loginAccountInput");
  const loginPasswordInput = document.getElementById("loginPasswordInput");
  const loginFeedback = document.getElementById("loginFeedback");
  const loginSubmitButton = document.getElementById("loginSubmitButton");

  if (!accountButton || !accountMenu) {
    return;
  }

  const currentUserKey = "oa_current_user";
  const authState = {
    loggedIn: true
  };

  const renderAuthState = () => {
    if (authState.loggedIn) {
      accountAvatar.textContent = "林";
      accountAvatar.classList.remove("bg-slate-400");
      accountAvatar.classList.add("bg-blue-600");
      accountName.textContent = "林岚";
      accountSubtitle.textContent = "辅助生殖中心-助理 · 19905678235";
      logoutButton.classList.remove("hidden");
      loginButton.classList.add("hidden");
      return;
    }

    accountAvatar.textContent = "未";
    accountAvatar.classList.remove("bg-blue-600");
    accountAvatar.classList.add("bg-slate-400");
    accountName.textContent = "未登录";
    accountSubtitle.textContent = "点击登录";
    logoutButton.classList.add("hidden");
    loginButton.classList.remove("hidden");
  };

  const closePanels = () => {
    accountMenu.classList.add("hidden");
  };

  const openLoginModal = () => {
    loginFeedback.textContent = "";
    loginAccountInput.value = "";
    loginPasswordInput.value = "";
    loginModal.classList.remove("hidden");
    loginModal.classList.add("flex");
  };

  accountButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!authState.loggedIn) {
      openLoginModal();
      return;
    }
    accountMenu.classList.toggle("hidden");
  });

  document.addEventListener("click", () => {
    closePanels();
  });

  logoutButton.addEventListener("click", () => {
    authState.loggedIn = false;
    localStorage.removeItem(currentUserKey);
    renderAuthState();
    closePanels();
  });

  loginButton.addEventListener("click", () => {
    closePanels();
    openLoginModal();
  });

  loginCloseButton.addEventListener("click", () => {
    loginModal.classList.add("hidden");
    loginModal.classList.remove("flex");
  });

  loginSubmitButton.addEventListener("click", () => {
    const account = (loginAccountInput.value || "").trim();
    const password = (loginPasswordInput.value || "").trim();

    if (account === "120627" && password === "92TWSL66") {
      localStorage.setItem(currentUserKey, "zhangchi");
      if (window.GameProgressTracker) {
        window.GameProgressTracker.markAction("loginZhangchi");
      }
      window.location.href = window.GameProgressTracker
        ? window.GameProgressTracker.resolveUrlWithStage("./012-desk-zhangchi.html")
        : "./012-desk-zhangchi.html";
      return;
    }

    if (account === "160423" && password === "1234Qwer") {
      authState.loggedIn = true;
      localStorage.setItem(currentUserKey, "linlan");
      if (window.GameProgressTracker) {
        window.GameProgressTracker.markAction("loginLinlan");
      }
      renderAuthState();
      loginModal.classList.add("hidden");
      loginModal.classList.remove("flex");
      return;
    }

    loginFeedback.textContent = "账号或密码错误";
  });

  if (window.OaWorkbenchNav) {
    window.OaWorkbenchNav.persistDesk("linlan");
  } else {
    localStorage.setItem(currentUserKey, "linlan");
  }
  renderAuthState();
}

document.addEventListener("DOMContentLoaded", () => {
  bind007DisabledActions();
  bind007AuthMenu();
});

