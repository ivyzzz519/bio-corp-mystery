(() => {
  const LOCAL_KEYS = [
    "game_progress_stage",
    "game_progress_last_inner_fill",
    "game_progress_visual_boost",
    "game_progress_visual_boost_triggered_pages",
    "game014_shadow_files_viewed",
    "game014_shadow_files_opened",
    "010_linlan_enc_unlocked_titles",
    "oa_current_user",
    "oa_mailbox_read",
    "wuyou_reset_mail_sent"
  ];
  const SESSION_KEYS = ["game014_shadow_archive_unlocked", "game015_aftermath_entered"];
  const WINDOW_STAGE_PREFIX = "__GAME_STAGE__:";

  function stripWindowStage() {
    try {
      const raw = String(window.name || "");
      const markerIndex = raw.indexOf(WINDOW_STAGE_PREFIX);
      if (markerIndex < 0) {
        return;
      }
      const before = raw.slice(0, markerIndex);
      const rest = raw.slice(markerIndex + WINDOW_STAGE_PREFIX.length);
      const suffix = rest.includes("|") ? rest.slice(rest.indexOf("|") + 1) : "";
      window.name = `${before}${suffix}`.replace(/^\|+|\|+$/g, "");
    } catch (error) {
      // Ignore window.name write failures.
    }
  }

  function clearAllGameProgress() {
    LOCAL_KEYS.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        // Ignore storage failures.
      }
    });
    SESSION_KEYS.forEach((key) => {
      try {
        sessionStorage.removeItem(key);
      } catch (error) {
        // Ignore storage failures.
      }
    });
    stripWindowStage();
  }

  window.clearAllGameProgress = clearAllGameProgress;
})();
