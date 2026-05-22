function bindMailboxPage() {
  const readStateKey = "oa_mailbox_read";
  const resetMailKey = "wuyou_reset_mail_sent";
  const currentUserKey = "oa_current_user";
  localStorage.setItem(readStateKey, "1");

  const mailTitle = document.getElementById("mailTitle");
  const mailMeta = document.getElementById("mailMeta");
  const mailBody = document.getElementById("mailBody");
  const mailActionLink = document.getElementById("mailActionLink");
  const inboxCount = document.getElementById("inboxCount");
  const adCount = document.getElementById("adCount");
  const inboxList = document.getElementById("inboxList");
  const adList = document.getElementById("adList");
  const backToWorkbenchLink = document.getElementById("backToWorkbenchLink");

  if (!inboxList || !adList) {
    return;
  }

  const linlanMailMap = {
    "biz-2": {
      title: "业务沟通：B-09批次流程记录补充",
      meta: "收件人：林岚（辅助生殖中心-助理）",
      body: [
        "请补全B-09批次在ERP中的处理日志，重点核对审批链与数据归档时间。",
        "该事项已被标记为内部敏感信息，请勿外传。",
        "—— 数据运营部"
      ],
      link: "",
      linkLabel: ""
    },
    "ad-1": {
      title: "🚨【空间告急】留住珍贵记忆！您的年度VIP特惠待激活",
      meta: "【发件人】：无忧云笔记官方团队 <noreply@wuyou-cloud.com>",
      body: [
        "【收件人】：林岚",
        "【发件时间】：2026年1月5日",
        "【邮件主题】：🚨【空间告急】留住珍贵记忆！您的年度VIP特惠待激活",
        "亲爱的用户 linlanlinmin，您好！",
        "时间是流沙，但您的记忆应当是磐石。",
        "系统检测到，您的【无忧云笔记】免费存储空间已使用至 98%，为了防止您的重要手记、工作备忘与加密文档因容量不足而停止同步，我们为您准备了老用户专属的【年度 VIP 三折特惠】！",
        "升级 VIP，您将立即解锁：",
        "无限极速云空间：再也不用为了腾空间而删除过去。",
        "端到端军工级加密：您的私密文件夹，除您之外无人能够窥探，安全级别坚不可摧。",
        "多端实时同步：无论何时何地，哪怕设备损毁，您的数据依然与您同在。"
      ],
      link: "./009-wuyou-login.html",
      linkLabel: "🔗 请点击此处立即登录并领取您的专属权益"
    },
    "reset-1": {
      title: "【密码重置通知】无忧云账户临时密码已生成",
      meta: "发件人：无忧云笔记 安全团队",
      body: [
        "亲爱的用户 linlanlinmin：",
        "您的无忧云账户于刚才提交了密码重置申请，系统已通过您的预留安全验证。",
        "您的临时登录密码已重置为：",
        "QWTR10002",
        "【安全提醒】：",
        "为了保障您的数据安全，该临时密码有效期为 24 小时，请尽快登录并修改。",
        "无忧云笔记 安全团队"
      ],
      link: "./009-wuyou-login.html",
      linkLabel: "前往无忧云笔记登录"
    }
  };

  const linminMailMap = {
    "hr-onboard": {
      title: "🛡️【入职指引】欢迎加入巨象万维，即将开启无线生物驻场服务",
      meta: "发件人：巨象万维 - 人事部 hr@giant-web.com | 收件时间：2026年05月11日 09:00",
      body: [
        "亲爱的林敏（工号：250812）：",
        "欢迎加入 巨象万维（Giant Web）。",
        "作为巨象科技（Giant Tech）旗下的全资子公司，巨象万维始终致力于为全球顶尖的生物医疗机构提供坚不可摧的数字底层架构。目前，我们已与无限生物科技有限公司达成深度战略合作，为其提供全案的私有云托管与系统维护服务。",
        "经集团调配，你已被分配至 “支持-IT五组”，并作为驻场外包专员，负责无线生物科技内网的一体化平台运维。",
        "请仔细核对并记录你的系统初始档案，这将是你访问无线生物内网的核心凭证：",
        "姓名： 林敏",
        "入职主体： 巨象万维（巨象科技全资子公司）",
        "服务对象： 无线生物科技有限公司（战略合作伙伴）",
        "预留安全校验生日： 2000年3月16日 巨象万维 行政人事部（抄送：巨象科技总部支持中心）"
      ],
      link: "",
      linkLabel: ""
    }
  };

  const zhangchiMailMap = {
    "soc-1": {
      title: "订阅更新：男人就应该多生孩子？从汪斯克到余波的观点争议",
      meta: "发件人：阿尔法男性征服世界社群",
      body: [
        "这是您订阅的男性生育责任消息摘要。",
        "本期是两位优秀男性围绕“生育多少孩子才能阻止人类灭亡”展开讨论，整理了多方观点与争议。",
        "据悉，余波已有一百个儿子，他希望再生五十个，并现场和汪斯克发起生育数量对决"
      ],
      link: "",
      linkLabel: ""
    },
    "soc-2": {
      title: "订阅更新：摩门教家庭结构与多子女文化专题",
      meta: "发件人：Faith & Family Social",
      body: [
        "本期为您推送关于摩门教家庭文化的长文合集。",
        "重点讨论“多生育”理念和女性精神崇拜男性如何创造一个美好的社会"
      ],
      link: "",
      linkLabel: ""
    },
    "soc-3": {
      title: "订阅更新：为什么男人一定要有儿子",
      meta: "发件人：Manruletheworld 社交订阅",
      body: [
        "您关注的话题“儿子”有新帖文合辑。",
        "男子发布自己在生育五个女儿后终于有了一个儿子，可以和他一起看球的快乐"
      ],
      link: "",
      linkLabel: ""
    },
    "soc-4": {
      title: "订阅更新：父职社群热议 - 三孩家庭的现实成本",
      meta: "发件人：DadCircle 社交订阅",
      body: [
        "过去一周，社群围绕“三孩家庭是否可持续”发布了42条新讨论。",
        "热门回复聚焦教育、住房、健康和时间管理。"
      ],
      link: "",
      linkLabel: ""
    },
    "soc-5": {
      title: "订阅更新：高净值人群生育观念变化观察",
      meta: "发件人：社会议题订阅号 InsightFeed",
      body: [
        "这是您订阅的“生育观念变化”专题推送。",
        "内容包含企业家公开访谈、社媒评论和观点梳理。"
      ],
      link: "",
      linkLabel: ""
    },
    "soc-6": {
      title: "订阅更新：生育伦理辩论帖精选（男方视角）",
      meta: "发件人：OpenDebate 社区",
      body: [
        "本期精选12篇辩论帖，覆盖男性生育责任、家庭分工和政策影响。",
        "内容来自公开社交平台聚合，不代表平台立场。"
      ],
      link: "",
      linkLabel: ""
    },
    "soc-7": {
      title: "订阅更新：跨文化宗教家庭生育习俗比较",
      meta: "发件人：CultureNet Social Digest",
      body: [
        "系统为您汇总了多宗教背景下家庭生育习俗的社交讨论。",
        "包含摩门教、天主教与世俗家庭样本帖子。"
      ],
      link: "",
      linkLabel: ""
    },
    "paper-1": {
      title: "Frontier paper alert: Recovery pathways for male oligoasthenozoospermia",
      meta: "Sender: Reproductive Medicine Weekly",
      body: [
        "New publication recommendation:",
        "\"Mitochondrial Redox Reprogramming Restores Spermatogenic Function in Oligoasthenozoospermic Men\"",
        "You are receiving this because you subscribed to Andrology frontier paper alerts."
      ],
      link: "",
      linkLabel: ""
    }
  };

  const renderMail = (key, mailMap) => {
    const items = document.querySelectorAll(".mail-item");
    const mail = mailMap[key];
    if (!mail || !mailTitle || !mailMeta || !mailBody || !mailActionLink) {
      return;
    }

    mailTitle.textContent = mail.title;
    mailMeta.textContent = mail.meta;
    mailBody.innerHTML = mail.body
      .map((line) => {
        const trimmed = String(line || "").trim();
        if (!trimmed) {
          return "";
        }
        if (/^亲爱的用户/.test(trimmed)) {
          return `<p class="prose-lead">${line}</p>`;
        }
        return `<p>${line}</p>`;
      })
      .join("");

    if (mail.link) {
      mailActionLink.href = mail.link;
      mailActionLink.textContent = mail.linkLabel || "前往查看详情";
      mailActionLink.classList.remove("hidden");
    } else {
      mailActionLink.classList.add("hidden");
    }

    items.forEach((item) => {
      const isActive = item.dataset.mail === key;
      item.classList.toggle("border-blue-100", isActive);
      item.classList.toggle("bg-blue-50/70", isActive);
    });
  };

  const createMailButton = (mailKey, mail, isActive) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.mail = mailKey;
    button.className = `mail-item w-full rounded-xl border px-4 py-3 text-left ${
      isActive ? "border-blue-100 bg-blue-50/70" : "border-slate-200 hover:bg-slate-50"
    }`;
    button.innerHTML = `
      <p class="text-sm font-semibold text-slate-800">${mail.title}</p>
      <p class="mt-1 text-xs text-slate-500">${mail.meta}</p>
    `;
    return button;
  };

  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get("view");
  const storedUser = localStorage.getItem(currentUserKey) || "";

  let mailboxMode = "linmin";
  if (viewParam === "zhangchi" || (!viewParam && storedUser === "zhangchi")) {
    mailboxMode = "zhangchi";
  } else if (
    viewParam === "linlan" ||
    (!viewParam && storedUser === "linlan") ||
    (viewParam === "linmin" && storedUser === "linlan")
  ) {
    mailboxMode = "linlan";
  } else if (viewParam === "linmin") {
    mailboxMode = "linmin";
  }

  const adHeading = adList.previousElementSibling;

  if (backToWorkbenchLink) {
    const url =
      mailboxMode === "zhangchi"
        ? "./012-desk-zhangchi.html"
        : mailboxMode === "linlan"
          ? "./007-desk-linlan.html"
          : "./001-oa-home.html";
    backToWorkbenchLink.href = window.GameProgressTracker
      ? window.GameProgressTracker.resolveUrlWithStage(url)
      : url;
  }

  const setAdSectionVisible = (visible) => {
    if (adHeading && adHeading.tagName === "H2") {
      adHeading.classList.toggle("hidden", !visible);
    }
    adList.classList.toggle("hidden", !visible);
  };

  if (mailboxMode === "linmin") {
    setAdSectionVisible(false);
    const mailEntries = Object.entries(linminMailMap);
    inboxList.innerHTML = "";
    mailEntries.forEach(([mailKey, mail], index) => {
      const button = createMailButton(mailKey, mail, index === 0);
      inboxList.appendChild(button);
      button.addEventListener("click", () => {
        renderMail(mailKey, linminMailMap);
      });
    });
    if (inboxCount) {
      inboxCount.textContent = String(mailEntries.length);
    }
    if (adCount) {
      adCount.textContent = "0";
    }
    renderMail("hr-onboard", linminMailMap);
    return;
  }

  setAdSectionVisible(true);

  if (mailboxMode === "zhangchi") {
    const mailEntries = Object.entries(zhangchiMailMap);
    inboxList.innerHTML = "";
    adList.innerHTML = "";
    mailEntries.forEach(([mailKey, mail], index) => {
      const button = createMailButton(mailKey, mail, index === 0);
      inboxList.appendChild(button);
      button.addEventListener("click", () => {
        renderMail(mailKey, zhangchiMailMap);
      });
    });
    if (inboxCount) {
      inboxCount.textContent = String(mailEntries.length);
    }
    if (adCount) {
      adCount.textContent = "0";
    }
    renderMail("soc-1", zhangchiMailMap);
    return;
  }

  const resetMailItem = document.getElementById("resetMailItem");
  const hasResetMail = localStorage.getItem(resetMailKey) === "1";
  if (resetMailItem) {
    resetMailItem.classList.toggle("hidden", !hasResetMail);
  }
  if (inboxCount) {
    inboxCount.textContent = hasResetMail ? "2" : "1";
  }

  const items = document.querySelectorAll(".mail-item");
  items.forEach((item) => {
    item.addEventListener("click", () => {
      renderMail(item.dataset.mail || "", linlanMailMap);
    });
  });

  if (adCount) {
    adCount.textContent = "1";
  }
  if (window.GameProgressTracker) {
    window.GameProgressTracker.markAction("enterLinlanMailbox");
  }
  renderMail(hasResetMail ? "reset-1" : "biz-2", linlanMailMap);
}

document.addEventListener("DOMContentLoaded", bindMailboxPage);

