function bindPage009() {
  const loginPage = document.getElementById("loginPage");
  const recoverPage = document.getElementById("recoverPage");
  const accountInput = document.getElementById("cloudAccountInput");
  const passwordInput = document.getElementById("cloudPasswordInput");
  const loginSubmit = document.getElementById("cloudLoginSubmit");
  const loginFeedback = document.getElementById("cloudLoginFeedback");

  const toggleRecoverBtn = document.getElementById("toggleRecoverBtn");
  const backToLoginBtn = document.getElementById("backToLoginBtn");
  const recoverRealNameInput = document.getElementById("recoverRealNameInput");
  const recoverPhoneInput = document.getElementById("recoverPhoneInput");
  const recoverMethodSelect = document.getElementById("recoverMethodSelect");
  const recoverSubmitBtn = document.getElementById("recoverSubmitBtn");
  const recoverFeedback = document.getElementById("recoverFeedback");

  const resetMailKey = "wuyou_reset_mail_sent";

  if (!accountInput || !passwordInput || !loginSubmit) {
    return;
  }

  const showRecoverPage = () => {
    recoverFeedback.textContent = "";
    loginPage.classList.add("hidden");
    recoverPage.classList.remove("hidden");
  };

  const showLoginPage = () => {
    recoverFeedback.textContent = "";
    recoverFeedback.classList.remove("text-emerald-600");
    recoverFeedback.classList.add("text-rose-600");
    recoverPage.classList.add("hidden");
    loginPage.classList.remove("hidden");
  };

  toggleRecoverBtn.addEventListener("click", showRecoverPage);
  backToLoginBtn.addEventListener("click", showLoginPage);

  recoverSubmitBtn.addEventListener("click", () => {
    const name = (recoverRealNameInput.value || "").trim();
    const phone = (recoverPhoneInput.value || "").trim();
    const method = recoverMethodSelect.value;

    if (name !== "林岚" || phone !== "19905678235" || method !== "email") {
      recoverFeedback.textContent = "信息不匹配，无法找回";
      return;
    }

    localStorage.setItem(resetMailKey, "1");
    recoverFeedback.classList.remove("text-rose-600");
    recoverFeedback.classList.add("text-emerald-600");
    recoverFeedback.textContent = "已通过邮箱找回";
  });

  loginSubmit.addEventListener("click", () => {
    const account = (accountInput.value || "").trim();
    const password = (passwordInput.value || "").trim();

    if (account === "linlanlinmin" && password === "QWTR10002") {
      localStorage.setItem("oa_current_user", "linlan");
      loginFeedback.classList.remove("text-rose-600");
      loginFeedback.classList.add("text-emerald-600");
      loginFeedback.textContent = "登录成功，正在跳转...";
      setTimeout(() => {
        window.location.href = window.GameProgressTracker
          ? window.GameProgressTracker.resolveUrlWithStage("./010-notes-linlan.html")
          : "./010-notes-linlan.html";
      }, 500);
      return;
    }

    loginFeedback.classList.remove("text-emerald-600");
    loginFeedback.classList.add("text-rose-600");
    loginFeedback.textContent = "账号或密码错误";
  });
}

document.addEventListener("DOMContentLoaded", bindPage009);

