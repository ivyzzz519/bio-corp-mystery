/**
 * Core search-driven deduction game logic draft.
 * You can import these functions into your UI layer directly.
 */

// Evidence database:
// key: searchable keyword
// value: response content + whether it unlocks a new dossier
const evidenceDB = {
  "仓库": {
    reply: "你在旧仓库里发现了带血的手套，标签写着 23:40 入库。",
    unlockNewFile: true,
    unlockedFileName: "仓库物证档案"
  },
  "手套": {
    reply: "手套内侧有化工厂粉尘残留，与嫌疑人工作环境一致。",
    unlockNewFile: false,
    unlockedFileName: null
  },
  "监控": {
    reply: "监控在 23:41 出现 17 秒盲区，疑似人为遮挡。",
    unlockNewFile: true,
    unlockedFileName: "监控异常报告"
  }
};

// Game runtime state
const gameState = {
  discoveredClues: new Set(), // all searched keywords that matched
  unlockedFiles: new Set() // all dossier names that have been unlocked
};

/**
 * Hook for UI rendering. Replace this in real page logic.
 * @param {Object} result search result payload
 */
function updateSearchUI(result) {
  // Draft output; can be replaced by DOM rendering in your project.
  console.log("[SearchResult]", result);
}

/**
 * Normalizes user input to improve matching consistency.
 * @param {string} keyword
 * @returns {string}
 */
function normalizeKeyword(keyword) {
  return String(keyword || "").trim().toLowerCase();
}

/**
 * Handles player keyword search.
 * - Matches against evidenceDB
 * - Prevents duplicate clue unlock triggers
 * - Returns a structured result for UI display
 *
 * @param {string} keyword
 * @returns {Object} result
 */
function handleSearch(keyword) {
  const normalized = normalizeKeyword(keyword);

  if (!normalized) {
    const emptyResult = {
      ok: false,
      keyword: normalized,
      message: "请输入有效关键词。",
      isDuplicate: false,
      unlockTriggered: false,
      unlockedFileName: null
    };
    updateSearchUI(emptyResult);
    return emptyResult;
  }

  const evidence = evidenceDB[normalized];

  if (!evidence) {
    const missResult = {
      ok: false,
      keyword: normalized,
      message: "没有检索到相关线索。",
      isDuplicate: false,
      unlockTriggered: false,
      unlockedFileName: null
    };
    updateSearchUI(missResult);
    return missResult;
  }

  const isDuplicate = gameState.discoveredClues.has(normalized);
  let unlockTriggered = false;

  if (!isDuplicate) {
    gameState.discoveredClues.add(normalized);

    if (evidence.unlockNewFile && evidence.unlockedFileName) {
      // Prevent repeated unlocks for the same dossier.
      if (!gameState.unlockedFiles.has(evidence.unlockedFileName)) {
        gameState.unlockedFiles.add(evidence.unlockedFileName);
        unlockTriggered = true;
      }
    }
  }

  const result = {
    ok: true,
    keyword: normalized,
    message: evidence.reply,
    isDuplicate,
    unlockTriggered,
    unlockedFileName: unlockTriggered ? evidence.unlockedFileName : null,
    discoveredCount: gameState.discoveredClues.size,
    unlockedFileCount: gameState.unlockedFiles.size
  };

  updateSearchUI(result);
  return result;
}

/**
 * Optional helper: inspect current state safely.
 */
function getGameStateSnapshot() {
  return {
    discoveredClues: Array.from(gameState.discoveredClues),
    unlockedFiles: Array.from(gameState.unlockedFiles)
  };
}

// Export for browser global or module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    evidenceDB,
    gameState,
    handleSearch,
    getGameStateSnapshot,
    updateSearchUI
  };
}
