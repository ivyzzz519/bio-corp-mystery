function bind012Interactions() {
  const hintEl = document.getElementById("disabledHint");
  const disabledButtons = document.querySelectorAll("[data-disabled]");
  const accountButton = document.getElementById("accountButton");
  const accountMenu = document.getElementById("accountMenu");
  const logoutButton = document.getElementById("logoutButton");
  const loginButton = document.getElementById("loginButton");
  const loginModal = document.getElementById("loginModal");
  const loginCloseButton = document.getElementById("loginCloseButton");
  const loginAccountInput = document.getElementById("loginAccountInput");
  const loginPasswordInput = document.getElementById("loginPasswordInput");
  const loginFeedback = document.getElementById("loginFeedback");
  const loginSubmitButton = document.getElementById("loginSubmitButton");
  const accountAvatar = document.getElementById("accountAvatar");
  const accountName = document.getElementById("accountName");
  const accountSubtitle = document.getElementById("accountSubtitle");
  const oaDownloadButton = document.getElementById("oaDownloadButton");
  const downloadTrayButton = document.getElementById("downloadTrayButton");
  const downloadTrayText = document.getElementById("downloadTrayText");
  const virtualExplorerModal = document.getElementById("virtualExplorerModal");
  const virtualExplorerCloseButton = document.getElementById("virtualExplorerCloseButton");
  const virtualPathText = document.getElementById("virtualPathText");
  const virtualFileEntry = document.getElementById("virtualFileEntry");
  const virtualFileName = document.getElementById("virtualFileName");
  const viewFileButton = document.getElementById("viewFileButton");
  const renameEditor = document.getElementById("renameEditor");
  const renameInput = document.getElementById("renameInput");
  const renameConfirmButton = document.getElementById("renameConfirmButton");
  const renameCancelButton = document.getElementById("renameCancelButton");
  const extractZipButton = document.getElementById("extractZipButton");
  const virtualActionHint = document.getElementById("virtualActionHint");
  const extractedFilesPanel = document.getElementById("extractedFilesPanel");
  const fileContextMenu = document.getElementById("fileContextMenu");
  const audioRecordModal = document.getElementById("audioRecordModal");
  const audioRecordCloseButton = document.getElementById("audioRecordCloseButton");
  const openExtractedWavButton = document.getElementById("openExtractedWavButton");
  const audioWaveBars = document.getElementById("audioWaveBars");
  const audioTranscriptBox = document.getElementById("audioTranscriptBox");

  const currentUserKey = "oa_current_user";
  const authState = { loggedIn: true };
  const virtualDownloadState = {
    downloaded: false,
    fileName: "B-09B_ultrasound_preview.dcm",
    extracted: false
  };
  const audioPlaybackState = {
    waveTimer: null,
    transcriptTimer: null,
    transcriptComplete: false
  };
  const transcriptLines = [
    "录音内容，呈现一段声波文，有一段是没有",
    "张弛——不要以为你背后&%&*^**(听不清）",
    "张弛——我没有杀人，充其量只算是医疗失误，况且这里算哪门子医疗部门，货物也是你们销毁的，和我有什么关系？",
    "陈文——行啊，你去告，赵总后面是什么，你张弛再不聪明也大概能猜到。",
    "一堆混乱的声音，听不清",
    "陈文——你自己没管好你们部门的圣母，解决她，我算你将功赎过"
  ];

  let truthRevealStarted = false;

  const startTruthRevealSequence = () => {
    if (truthRevealStarted) {
      return;
    }
    truthRevealStarted = true;
    const overlay = document.createElement("div");
    overlay.id = "truthRevealOverlay";
    overlay.className =
      "fixed inset-0 z-[130] flex flex-col items-center justify-center bg-slate-950/88 px-6 text-slate-100";
    overlay.innerHTML = `
      <div id="truthRevealBufferBlock" class="flex w-full max-w-xs flex-col items-center gap-5">
        <p class="text-xs tracking-wide text-slate-400">正在同步线索</p>
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div class="truth-reveal-indeterminate h-full w-2/5 rounded-full bg-sky-400/90"></div>
        </div>
      </div>
      <p id="truthRevealMessage" class="mt-10 hidden text-center text-lg font-medium text-white">似乎已经找到真相</p>
    `;
    const bufferStyle = document.createElement("style");
    bufferStyle.textContent = `
      @keyframes truth-reveal-indeterminate-move {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(280%); }
      }
      .truth-reveal-indeterminate {
        animation: truth-reveal-indeterminate-move 1.1s ease-in-out infinite;
      }
    `;
    document.head.appendChild(bufferStyle);
    document.body.appendChild(overlay);

    window.setTimeout(() => {
      const buf = document.getElementById("truthRevealBufferBlock");
      const msg = document.getElementById("truthRevealMessage");
      if (buf) {
        buf.classList.add("hidden");
      }
      if (msg) {
        msg.classList.remove("hidden");
      }
    }, 1100);

    window.setTimeout(() => {
      const reportUrl = window.GameProgressTracker
        ? window.GameProgressTracker.resolveUrlWithStage("./013-ending-report-to-police.html")
        : "./013-ending-report-to-police.html";
      window.location.href = reportUrl;
    }, 2800);
  };

  const getCurrentFileExt = () => {
    const segments = virtualDownloadState.fileName.split(".");
    if (segments.length < 2) {
      return "";
    }
    return (segments[segments.length - 1] || "").toLowerCase();
  };

  const renderVirtualFileName = () => {
    if (!virtualFileName) {
      return;
    }
    virtualFileName.textContent = virtualDownloadState.fileName;
  };

  const buildAudioWaveBars = () => {
    if (!audioWaveBars) {
      return [];
    }
    audioWaveBars.innerHTML = "";
    const bars = [];
    const barCount = 56;
    for (let i = 0; i < barCount; i += 1) {
      const bar = document.createElement("span");
      bar.className =
        "block min-h-[8px] min-w-0 flex-1 rounded-full bg-emerald-400/80 transition-all duration-150";
      bar.style.height = `${10 + Math.floor(Math.random() * 16)}px`;
      audioWaveBars.appendChild(bar);
      bars.push(bar);
    }
    return bars;
  };

  const stopAudioPlayback = () => {
    if (audioPlaybackState.waveTimer) {
      clearInterval(audioPlaybackState.waveTimer);
      audioPlaybackState.waveTimer = null;
    }
    if (audioPlaybackState.transcriptTimer) {
      clearTimeout(audioPlaybackState.transcriptTimer);
      audioPlaybackState.transcriptTimer = null;
    }
  };

  const openAudioRecordModal = () => {
    if (!audioRecordModal || !audioTranscriptBox) {
      return;
    }
    stopAudioPlayback();
    audioPlaybackState.transcriptComplete = false;
    truthRevealStarted = false;
    audioRecordModal.classList.remove("hidden");
    audioRecordModal.classList.add("flex");
    audioTranscriptBox.innerHTML = "";
    const bars = buildAudioWaveBars();
    audioPlaybackState.waveTimer = setInterval(() => {
      bars.forEach((bar, index) => {
        const base = 10 + Math.floor(Math.random() * 64);
        const pulse = index % 8 === 0 ? 16 : 0;
        bar.style.height = `${Math.min(88, base + pulse)}px`;
        bar.style.opacity = `${0.5 + Math.random() * 0.5}`;
      });
    }, 180);

    let currentLine = 0;
    const printNextLine = () => {
      if (!audioTranscriptBox) {
        return;
      }
      if (currentLine >= transcriptLines.length) {
        audioPlaybackState.transcriptComplete = true;
        if (window.GameProgressTracker) {
          window.GameProgressTracker.markAction("viewAudioRecord");
        }
        startTruthRevealSequence();
        audioPlaybackState.transcriptTimer = null;
        return;
      }
      const lineEl = document.createElement("p");
      lineEl.className = "text-slate-100";
      if (transcriptLines[currentLine].includes("听不清")) {
        lineEl.className += " text-slate-400 italic";
      }
      lineEl.textContent = transcriptLines[currentLine];
      audioTranscriptBox.appendChild(lineEl);
      audioTranscriptBox.scrollTop = audioTranscriptBox.scrollHeight;
      currentLine += 1;
      audioPlaybackState.transcriptTimer = setTimeout(printNextLine, 1300);
    };
    audioPlaybackState.transcriptTimer = setTimeout(printNextLine, 500);
  };

  const closeAudioRecordModal = () => {
    if (!audioRecordModal) {
      return;
    }
    stopAudioPlayback();
    audioRecordModal.classList.add("hidden");
    audioRecordModal.classList.remove("flex");
    /** 未进入「同步线索」前关闭录音（按钮 / 遮罩 / Esc）：与听完字幕相同，进入结局1 流程 */
    if (!truthRevealStarted) {
      if (window.GameProgressTracker) {
        window.GameProgressTracker.markAction("viewAudioRecord");
      }
      startTruthRevealSequence();
    }
  };

  const hideFileContextMenu = () => {
    if (!fileContextMenu) {
      return;
    }
    fileContextMenu.classList.add("hidden");
  };

  const showFileContextMenu = (x, y) => {
    if (!fileContextMenu) {
      return;
    }
    fileContextMenu.style.left = `${x}px`;
    fileContextMenu.style.top = `${y}px`;
    fileContextMenu.classList.remove("hidden");
  };

  const openRenameEditor = () => {
    if (!renameEditor || !renameInput) {
      return;
    }
    renameEditor.classList.remove("hidden");
    renameEditor.classList.add("flex");
    renameInput.value = virtualDownloadState.fileName;
    renameInput.focus();
    renameInput.setSelectionRange(0, renameInput.value.length);
  };

  const closeRenameEditor = () => {
    if (!renameEditor) {
      return;
    }
    renameEditor.classList.add("hidden");
    renameEditor.classList.remove("flex");
  };

  const renderAuthState = () => {
    if (authState.loggedIn) {
      accountAvatar.textContent = "张";
      accountName.textContent = "张弛";
      accountSubtitle.textContent = "访客账号 · 权限受限";
      logoutButton.classList.remove("hidden");
      loginButton.classList.add("hidden");
      return;
    }
    accountAvatar.textContent = "未";
    accountName.textContent = "未登录";
    accountSubtitle.textContent = "点击登录";
    logoutButton.classList.add("hidden");
    loginButton.classList.remove("hidden");
  };

  disabledButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!hintEl) {
        return;
      }
      hintEl.textContent = button.getAttribute("data-disabled") || "已被禁用";
      hintEl.classList.remove("hidden");
    });
  });

  accountButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!authState.loggedIn) {
      loginModal.classList.remove("hidden");
      loginModal.classList.add("flex");
      return;
    }
    accountMenu.classList.toggle("hidden");
  });

  document.addEventListener("click", () => {
    accountMenu.classList.add("hidden");
    hideFileContextMenu();
  });

  logoutButton.addEventListener("click", () => {
    authState.loggedIn = false;
    localStorage.removeItem(currentUserKey);
    renderAuthState();
    accountMenu.classList.add("hidden");
  });

  loginButton.addEventListener("click", () => {
    accountMenu.classList.add("hidden");
    loginModal.classList.remove("hidden");
    loginModal.classList.add("flex");
  });

  loginCloseButton.addEventListener("click", () => {
    loginModal.classList.add("hidden");
    loginModal.classList.remove("flex");
  });

  loginSubmitButton.addEventListener("click", () => {
    const account = (loginAccountInput.value || "").trim();
    const password = (loginPasswordInput.value || "").trim();
    if (account === "120627" && password === "92TWSL66") {
      authState.loggedIn = true;
      localStorage.setItem(currentUserKey, "zhangchi");
      if (window.GameProgressTracker) {
        window.GameProgressTracker.markAction("loginZhangchi");
      }
      renderAuthState();
      loginModal.classList.add("hidden");
      loginModal.classList.remove("flex");
      loginFeedback.textContent = "";
      return;
    }
    if (account === "160423" && password === "1234Qwer") {
      localStorage.setItem(currentUserKey, "linlan");
      window.location.href = window.GameProgressTracker
        ? window.GameProgressTracker.resolveUrlWithStage("./001-oa-home.html")
        : "./001-oa-home.html";
      return;
    }
    loginFeedback.textContent = "账号或密码错误";
  });

  if (oaDownloadButton) {
    oaDownloadButton.addEventListener("click", () => {
      virtualDownloadState.downloaded = true;
      virtualDownloadState.fileName = "B-09B_ultrasound_preview.dcm";
      virtualDownloadState.extracted = false;
      if (downloadTrayButton) {
        downloadTrayButton.classList.remove("hidden");
        downloadTrayButton.classList.add("inline-flex");
      }
      if (downloadTrayText) {
        downloadTrayText.textContent = "B-09B_ultrasound_preview.dcm 下载完成";
      }
      renderVirtualFileName();
      if (virtualActionHint) {
        virtualActionHint.textContent = "";
      }
      if (extractedFilesPanel) {
        extractedFilesPanel.classList.add("hidden");
      }
      closeRenameEditor();
      if (hintEl) {
        hintEl.textContent = "模拟下载已完成：右下角出现下载标识。";
        hintEl.classList.remove("hidden");
      }
    });
  }

  if (downloadTrayButton) {
    downloadTrayButton.addEventListener("click", () => {
      if (!virtualDownloadState.downloaded || !virtualExplorerModal) {
        return;
      }
      if (virtualPathText) {
        virtualPathText.textContent = "C:\\Users\\Player\\Downloads\\Case_0422\\";
      }
      if (virtualActionHint && !virtualDownloadState.extracted) {
        virtualActionHint.textContent = "";
      }
      hideFileContextMenu();
      closeRenameEditor();
      virtualExplorerModal.classList.remove("hidden");
      virtualExplorerModal.classList.add("flex");
    });
  }

  if (virtualExplorerCloseButton) {
    virtualExplorerCloseButton.addEventListener("click", () => {
      if (!virtualExplorerModal) {
        return;
      }
      hideFileContextMenu();
      closeRenameEditor();
      virtualExplorerModal.classList.add("hidden");
      virtualExplorerModal.classList.remove("flex");
    });
  }

  if (viewFileButton) {
    viewFileButton.addEventListener("click", () => {
      if (!virtualDownloadState.downloaded) {
        return;
      }
      const ext = getCurrentFileExt();
      if (ext === "wav") {
        openAudioRecordModal();
        return;
      }
      if (virtualActionHint) {
        virtualActionHint.textContent =
          ext === "dcm"
            ? "DICOM（.dcm）无法在此预览。"
            : ext === "zip"
              ? "压缩包请使用下方「解压文件」，而非「查看文件」。"
              : "当前格式无法在此预览。";
      }
    });

    viewFileButton.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      if (!virtualDownloadState.downloaded) {
        return;
      }
      closeRenameEditor();
      showFileContextMenu(event.clientX, event.clientY);
    });
  }

  if (audioRecordCloseButton) {
    audioRecordCloseButton.addEventListener("click", closeAudioRecordModal);
  }

  if (audioRecordModal) {
    audioRecordModal.addEventListener("click", (event) => {
      if (event.target === audioRecordModal) {
        closeAudioRecordModal();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && audioRecordModal && !audioRecordModal.classList.contains("hidden")) {
      closeAudioRecordModal();
    }
  });

  if (virtualFileEntry) {
    virtualFileEntry.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      if (!virtualDownloadState.downloaded) {
        return;
      }
      closeRenameEditor();
      showFileContextMenu(event.clientX, event.clientY);
    });
  }

  if (extractZipButton) {
    extractZipButton.addEventListener("click", () => {
      const ext = getCurrentFileExt();
      if (ext !== "zip") {
        if (virtualActionHint) {
          virtualActionHint.textContent = "无法打开压缩包：文件格式不受支持。";
        }
        if (extractedFilesPanel) {
          extractedFilesPanel.classList.add("hidden");
        }
        virtualDownloadState.extracted = false;
        return;
      }
      virtualDownloadState.extracted = true;
      if (extractedFilesPanel) {
        extractedFilesPanel.classList.remove("hidden");
      }
      if (virtualActionHint) {
        virtualActionHint.textContent = "压缩包已打开。点击下方「把柄.wav」可查看声纹波形与文字记录。";
      }
    });
  }

  const confirmRename = () => {
    if (!renameInput || !virtualActionHint) {
      return;
    }
    const nextFileName = (renameInput.value || "").trim();
    if (!nextFileName) {
      virtualActionHint.textContent = "文件名不能为空。";
      return;
    }
    virtualDownloadState.fileName = nextFileName;
    virtualDownloadState.extracted = false;
    renderVirtualFileName();
    if (window.GameProgressTracker) {
      window.GameProgressTracker.markAction("modifyFile");
    }
    if (extractedFilesPanel) {
      extractedFilesPanel.classList.add("hidden");
    }
    closeRenameEditor();
    const ext = getCurrentFileExt();
    if (ext === "zip") {
      virtualActionHint.textContent = `重命名成功：${nextFileName}`;
      return;
    }
    virtualActionHint.textContent = `重命名成功：${nextFileName}。该格式暂不识别。`;
  };

  if (renameConfirmButton) {
    renameConfirmButton.addEventListener("click", confirmRename);
  }

  if (renameCancelButton) {
    renameCancelButton.addEventListener("click", () => {
      closeRenameEditor();
    });
  }

  if (renameInput) {
    renameInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        confirmRename();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closeRenameEditor();
      }
    });
  }

  if (fileContextMenu) {
    fileContextMenu.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const action = target.dataset.action;
      if (!action) {
        return;
      }
      hideFileContextMenu();
      if (!virtualActionHint) {
        return;
      }

      if (action === "rename") {
        virtualActionHint.textContent = "";
        openRenameEditor();
        return;
      }

      if (action === "open-zip-app") {
        if (getCurrentFileExt() !== "zip") {
          virtualActionHint.textContent = "压缩王.zip 无法识别该文件，请先改为 .zip。";
          return;
        }
        virtualDownloadState.extracted = true;
        if (extractedFilesPanel) {
          extractedFilesPanel.classList.remove("hidden");
        }
        virtualActionHint.textContent =
          "已使用压缩王.zip 打开：发现 把柄.wav（20 分钟）。点击下方「把柄.wav」可查看声纹波形与文字记录。";
        return;
      }

    });
  }

  if (openExtractedWavButton) {
    openExtractedWavButton.addEventListener("click", () => {
      if (!virtualDownloadState.extracted) {
        return;
      }
      openAudioRecordModal();
    });
  }

  if (window.OaWorkbenchNav) {
    window.OaWorkbenchNav.persistDesk("zhangchi");
  } else {
    localStorage.setItem(currentUserKey, "zhangchi");
  }
  renderAuthState();
}

document.addEventListener("DOMContentLoaded", bind012Interactions);
