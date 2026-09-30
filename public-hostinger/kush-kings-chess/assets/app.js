import { Chess } from "./chess.js";

const API_BASE = "./api";
const POLL_MS = 1500;
const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const TOKEN_KEY = "kkc_player_token";
const NAME_KEY = "kkc_player_name";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const whiteRanks = [8, 7, 6, 5, 4, 3, 2, 1];
const blackRanks = [1, 2, 3, 4, 5, 6, 7, 8];
const pieceGlyphs = {
  wk: "♔",
  wq: "♕",
  wr: "♖",
  wb: "♗",
  wn: "♘",
  wp: "♙",
  bk: "♚",
  bq: "♛",
  br: "♜",
  bb: "♝",
  bn: "♞",
  bp: "♟"
};

const els = {
  board: document.getElementById("board"),
  topPlayer: document.getElementById("top-player"),
  bottomPlayer: document.getElementById("bottom-player"),
  roomPill: document.getElementById("room-pill"),
  playerName: document.getElementById("player-name"),
  startingSide: document.getElementById("starting-side"),
  createRoom: document.getElementById("create-room"),
  newToken: document.getElementById("new-token"),
  joinForm: document.getElementById("join-form"),
  joinCode: document.getElementById("join-code"),
  gameStatus: document.getElementById("game-status"),
  copyInvite: document.getElementById("copy-invite"),
  resignMatch: document.getElementById("resign-match"),
  inviteUrl: document.getElementById("invite-url"),
  turnBox: document.getElementById("turn-box"),
  chatForm: document.getElementById("chat-form"),
  chatInput: document.getElementById("chat-input"),
  chatLog: document.getElementById("chat-log"),
  moveList: document.getElementById("move-list"),
  promotionDialog: document.getElementById("promotion-dialog"),
  promotionCancel: document.getElementById("promotion-cancel"),
  promotionButtons: Array.from(document.querySelectorAll("[data-promotion]")),
  toast: document.getElementById("toast")
};

const state = {
  token: getOrCreateToken(),
  game: null,
  chess: new Chess(),
  selected: null,
  legalTargets: new Map(),
  lastMove: null,
  lastChatId: 0,
  chatMessages: [],
  pollTimer: null,
  pollFailures: 0,
  pendingMove: false,
  pendingPromotion: null
};

els.playerName.value = localStorage.getItem(NAME_KEY) || "";
els.joinCode.value = codeFromUrl() || "";

render();

const initialCode = codeFromUrl();
if (initialCode) {
  joinRoom(initialCode).catch((err) => showError(err));
}

els.createRoom.addEventListener("click", () => {
  createRoom().catch((err) => showError(err));
});

els.newToken.addEventListener("click", () => {
  if (state.game?.status === "active" && (state.game.side === "white" || state.game.side === "black")) {
    showToast("Finish or resign this match before resetting your local player identity.");
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  state.token = getOrCreateToken();
  state.game = null;
  state.chess = new Chess();
  state.selected = null;
  state.legalTargets.clear();
  state.chatMessages = [];
  state.lastChatId = 0;
  state.lastMove = null;
  state.pollFailures = 0;
  stopPolling();
  clearRoomFromUrl();
  showToast("This browser is now a new local player.");
  render();
});

els.joinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  joinRoom(els.joinCode.value).catch((err) => showError(err));
});

els.copyInvite.addEventListener("click", async () => {
  if (!state.game?.code) return;
  const invite = inviteUrl(state.game.code);
  const copied = await copyText(invite);
  showToast(copied ? "Invite copied." : "Copy failed. Select the invite address below and copy it manually.");
});

els.resignMatch.addEventListener("click", () => {
  resignMatch().catch((err) => showError(err));
});

els.chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendChat().catch((err) => showError(err));
});

for (const button of els.promotionButtons) {
  button.addEventListener("click", () => {
    const promotion = button.dataset.promotion;
    completePromotion(promotion).catch((err) => showError(err));
  });
}

els.promotionCancel.addEventListener("click", cancelPromotion);
els.promotionDialog.addEventListener("cancel", () => {
  state.pendingPromotion = null;
});

window.addEventListener("beforeunload", stopPolling);
window.addEventListener("online", () => {
  if (state.game?.code) pollGame();
});
window.addEventListener("offline", () => {
  state.pollFailures = Math.max(state.pollFailures, 2);
  renderStatus();
  showToast("Connection interrupted. The room will retry automatically.");
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && state.game?.code) {
    pollGame();
  }
});

function getOrCreateToken() {
  const existing = localStorage.getItem(TOKEN_KEY);
  if (existing) return existing;
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  localStorage.setItem(TOKEN_KEY, token);
  return token;
}

function playerName() {
  const name = els.playerName.value.trim().slice(0, 24) || "Grower";
  localStorage.setItem(NAME_KEY, name);
  return name;
}

function codeFromUrl() {
  const url = new URL(window.location.href);
  const queryCode = url.searchParams.get("code");
  if (queryCode) return normalizeCode(queryCode);
  const cleanPath = window.location.pathname.split("/").filter(Boolean).pop();
  if (cleanPath && /^[a-z0-9]{4,12}$/i.test(cleanPath) && cleanPath !== "kush-kings-chess") {
    return normalizeCode(cleanPath);
  }
  return "";
}

function normalizeCode(code) {
  return String(code || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);
}

function clearRoomFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

async function createRoom() {
  const game = await postJson("create-game.php", {
    token: state.token,
    name: playerName(),
    side: els.startingSide.value,
    unlisted: false
  });
  history.replaceState({}, "", `?code=${encodeURIComponent(game.code)}`);
  syncGame(game, { resetChat: true });
  startPolling();
  showToast(`Room ${game.code} is ready.`);
}

async function joinRoom(rawCode) {
  const code = normalizeCode(rawCode);
  if (!code) throw new Error("Enter a room code.");
  const game = await postJson("join-game.php", {
    code,
    token: state.token,
    name: playerName()
  });
  history.replaceState({}, "", `?code=${encodeURIComponent(game.code)}`);
  els.joinCode.value = game.code;
  syncGame(game, { resetChat: true });
  startPolling();
  showToast(`Joined room ${game.code}.`);
}

async function pollGame() {
  if (!state.game?.code) return;
  try {
    const game = await getJson(
      `get-game.php?code=${encodeURIComponent(state.game.code)}&token=${encodeURIComponent(
        state.token
      )}&chatAfterId=${encodeURIComponent(state.lastChatId)}`
    );
    const recovered = state.pollFailures >= 2;
    state.pollFailures = 0;
    syncGame(game);
    if (recovered) showToast("Room connection restored.");
  } catch (err) {
    state.pollFailures += 1;
    if (state.pollFailures === 2) {
      showToast("Connection interrupted. Retrying automatically.");
    }
    renderStatus();
    console.warn(err);
  }
}

function startPolling() {
  stopPolling();
  state.pollFailures = 0;
  state.pollTimer = window.setInterval(pollGame, POLL_MS);
}

function stopPolling() {
  if (state.pollTimer) {
    window.clearInterval(state.pollTimer);
    state.pollTimer = null;
  }
}

async function sendMove(from, to, promotion = null) {
  if (!state.game || state.pendingMove || !isMyTurn()) return;

  const moveInput = { from, to };
  if (promotion) moveInput.promotion = promotion;
  const move = state.chess.move(moveInput);
  if (!move) {
    render();
    return;
  }

  state.pendingMove = true;
  state.lastMove = { from, to };
  render();

  try {
    const game = await postJson("move.php", {
      code: state.game.code,
      token: state.token,
      moveNumber: state.game.moveNumber,
      from,
      to,
      promotion: move.promotion || promotion || null
    });
    syncGame(game);
  } catch (err) {
    await pollGame();
    throw err;
  } finally {
    state.pendingMove = false;
    render();
  }
}

async function resignMatch() {
  if (!state.game || state.game.status !== "active") return;
  if (state.game.side !== "white" && state.game.side !== "black") return;
  if (!window.confirm("Resign this match? Your opponent will be declared the winner.")) return;

  els.resignMatch.disabled = true;
  const game = await postJson("resign.php", {
    code: state.game.code,
    token: state.token
  });
  syncGame(game);
  showToast("Match resigned.");
}

async function sendChat() {
  if (!state.game?.code) throw new Error("Join a room first.");
  const message = els.chatInput.value.trim();
  if (!message) return;
  const game = await postJson("chat.php", {
    code: state.game.code,
    token: state.token,
    name: playerName(),
    message
  });
  els.chatInput.value = "";
  syncGame(game);
}

function syncGame(game, options = {}) {
  const previousFen = state.chess.fen();
  const serverHasLastMove = Object.prototype.hasOwnProperty.call(game, "lastMove");
  state.game = normalizeGame(game);
  if (serverHasLastMove) {
    state.lastMove = state.game.lastMove;
  }
  state.chess = new Chess();
  if (state.game.pgn) {
    try {
      state.chess.loadPgn(state.game.pgn);
    } catch (err) {
      console.warn("Unable to load PGN, falling back to FEN.", err);
      state.chess = new Chess(state.game.fen || START_FEN);
    }
  } else if (state.game.fen && state.game.fen !== START_FEN) {
    state.chess = new Chess(state.game.fen);
  }

  if (previousFen !== state.chess.fen()) {
    state.selected = null;
    state.legalTargets.clear();
    cancelPromotion();
  }

  if (options.resetChat) {
    state.chatMessages = [];
    state.lastChatId = 0;
  }
  mergeChat(state.game.chat || []);
  render();
}

function normalizeGame(game) {
  const lastMove = game.lastMove && /^[a-h][1-8]$/.test(game.lastMove.from || "") && /^[a-h][1-8]$/.test(game.lastMove.to || "")
    ? {
        from: game.lastMove.from,
        to: game.lastMove.to,
        moveNumber: Number(game.lastMove.moveNumber || 0),
        promotion: game.lastMove.promotion || null,
        san: game.lastMove.san || ""
      }
    : null;

  return {
    ...game,
    moveNumber: Number(game.moveNumber || 0),
    lastMove,
    chat: Array.isArray(game.chat) ? game.chat : []
  };
}

function mergeChat(messages) {
  if (!messages.length) return;
  const byId = new Map(state.chatMessages.map((message) => [message.id, message]));
  for (const message of messages) {
    byId.set(message.id, message);
    state.lastChatId = Math.max(state.lastChatId, Number(message.id || 0));
  }
  state.chatMessages = Array.from(byId.values()).sort((a, b) => Number(a.id) - Number(b.id));
}

function render() {
  document.body.dataset.gameStatus = state.game?.status || "setup";
  renderBoard();
  renderPlayers();
  renderStatus();
  renderChat();
  renderMoves();
}

function renderBoard() {
  const side = state.game?.side === "black" ? "black" : "white";
  const rankOrder = side === "black" ? blackRanks : whiteRanks;
  const fileOrder = side === "black" ? [...files].reverse() : files;
  const checkSquare = findCheckedKing();

  els.board.innerHTML = "";
  for (const rank of rankOrder) {
    for (const file of fileOrder) {
      const square = `${file}${rank}`;
      const piece = state.chess.get(square);
      const color = (files.indexOf(file) + rank) % 2 === 0 ? "dark" : "light";
      const button = document.createElement("button");
      button.type = "button";
      button.className = `square ${color}`;
      button.dataset.square = square;
      button.setAttribute("aria-label", `${square}${piece ? ` ${pieceName(piece)}` : ""}`);
      button.addEventListener("click", () => handleSquare(square));

      if (state.selected === square) button.classList.add("selected");
      if (state.legalTargets.has(square)) {
        button.classList.add(piece ? "capture" : "target");
      }
      if (state.lastMove && (state.lastMove.from === square || state.lastMove.to === square)) {
        button.classList.add("last-move");
      }
      if (checkSquare === square) button.classList.add("check");

      if (piece) {
        button.textContent = pieceGlyphs[`${piece.color}${piece.type}`];
      }
      if (file === fileOrder[0] || rank === rankOrder[rankOrder.length - 1]) {
        const coord = document.createElement("span");
        coord.className = "coord";
        coord.textContent =
          file === fileOrder[0] && rank === rankOrder[rankOrder.length - 1]
            ? square
            : file === fileOrder[0]
              ? rank
              : file;
        button.appendChild(coord);
      }
      els.board.appendChild(button);
    }
  }
}

function handleSquare(square) {
  if (!state.game || state.game.status === "finished" || state.pendingMove || state.pendingPromotion) return;
  if (!isMyTurn()) {
    showToast(turnMessage());
    return;
  }

  const piece = state.chess.get(square);
  if (!state.selected) {
    if (isOwnPiece(piece)) selectSquare(square);
    return;
  }

  if (state.selected === square) {
    clearSelection();
    return;
  }

  if (state.legalTargets.has(square)) {
    const from = state.selected;
    const candidates = state.legalTargets.get(square) || [];
    clearSelection();

    const promotionMoves = candidates.filter((move) => move.promotion);
    if (promotionMoves.length > 0) {
      requestPromotion(from, square, promotionMoves);
    } else {
      sendMove(from, square).catch((err) => showError(err));
    }
    return;
  }

  if (isOwnPiece(piece)) {
    selectSquare(square);
  } else {
    clearSelection();
  }
}

function selectSquare(square) {
  state.selected = square;
  state.legalTargets.clear();
  const moves = state.chess.moves({ square, verbose: true });
  for (const move of moves) {
    const candidates = state.legalTargets.get(move.to) || [];
    candidates.push(move);
    state.legalTargets.set(move.to, candidates);
  }
  renderBoard();
}

function clearSelection() {
  state.selected = null;
  state.legalTargets.clear();
  renderBoard();
}

function requestPromotion(from, to, moves) {
  const allowed = new Set(moves.map((move) => move.promotion).filter(Boolean));
  state.pendingPromotion = { from, to, allowed };

  for (const button of els.promotionButtons) {
    button.disabled = !allowed.has(button.dataset.promotion);
  }

  if (typeof els.promotionDialog.showModal === "function") {
    els.promotionDialog.showModal();
    return;
  }

  const fallback = allowed.has("q") ? "q" : Array.from(allowed)[0];
  completePromotion(fallback).catch((err) => showError(err));
}

async function completePromotion(promotion) {
  const pending = state.pendingPromotion;
  if (!pending || !pending.allowed.has(promotion)) return;
  state.pendingPromotion = null;
  if (els.promotionDialog.open) els.promotionDialog.close();
  await sendMove(pending.from, pending.to, promotion);
}

function cancelPromotion() {
  state.pendingPromotion = null;
  if (els.promotionDialog?.open) els.promotionDialog.close();
}

function renderPlayers() {
  const game = state.game;
  const topSide = game?.side === "black" ? "white" : "black";
  const bottomSide = game?.side === "black" ? "black" : "white";
  els.topPlayer.innerHTML = playerHtml(topSide);
  els.bottomPlayer.innerHTML = playerHtml(bottomSide);
}

function playerHtml(side) {
  const player = state.game?.[side];
  const label = side === "white" ? "Light side" : "Dark side";
  const name = escapeHtml(player?.name || `${label} open`);
  const connected = player?.connected ? "online" : player?.name ? "away" : "open";
  return `<span>${name}</span><small>${label} · ${connected}</small>`;
}

function renderStatus() {
  const game = state.game;
  document.body.dataset.gameStatus = game?.status || "setup";
  els.copyInvite.disabled = !game?.code;
  els.resignMatch.disabled = !(
    game?.status === "active" &&
    (game.side === "white" || game.side === "black") &&
    !state.pendingMove
  );
  els.chatInput.disabled = !game?.code;

  if (!game) {
    els.roomPill.textContent = "No room loaded";
    els.gameStatus.textContent = "Ready";
    els.inviteUrl.textContent = "Create or join a room to get an invite.";
    els.turnBox.textContent = "Waiting for a room.";
    document.title = "Kush Kings Chess";
    return;
  }

  const invite = inviteUrl(game.code);
  els.roomPill.textContent = `Room ${game.code} · ${sideLabel(game.side)}`;
  els.gameStatus.textContent =
    state.pollFailures >= 2
      ? "Reconnecting…"
      : game.status === "finished"
        ? "Finished"
        : game.status === "active"
          ? "Live match"
          : "Waiting";
  els.inviteUrl.textContent = invite;
  els.turnBox.textContent = state.pollFailures >= 2 ? "Connection interrupted. Retrying automatically." : turnMessage();
  document.title = isMyTurn() ? "(your turn) Kush Kings Chess" : "Kush Kings Chess";
}

function renderChat() {
  els.chatLog.innerHTML = "";
  const messages = state.chatMessages.slice(-50);
  for (const message of messages) {
    const item = document.createElement("li");
    const name = escapeHtml(message.playerName || "Grower");
    item.innerHTML = `<strong>${name}</strong> <span>${escapeHtml(message.side || "room")}</span><br />${escapeHtml(
      message.message || ""
    )}`;
    els.chatLog.appendChild(item);
  }
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
}

function renderMoves() {
  els.moveList.innerHTML = "";
  const history = state.chess.history({ verbose: true });
  history.forEach((move, index) => {
    const item = document.createElement("li");
    item.textContent = `${Math.floor(index / 2) + 1}${index % 2 === 0 ? "." : "..."} ${move.san}`;
    els.moveList.appendChild(item);
  });
}

function isMyTurn() {
  const side = playerColor();
  return Boolean(
    state.game &&
      state.game.status === "active" &&
      side &&
      state.chess.turn() === side &&
      !state.game.winner &&
      !state.game.endReason
  );
}

function playerColor() {
  if (state.game?.side === "white") return "w";
  if (state.game?.side === "black") return "b";
  return null;
}

function isOwnPiece(piece) {
  return Boolean(piece && piece.color === playerColor());
}

function turnMessage() {
  const game = state.game;
  if (!game) return "Waiting for a room.";
  if (game.status === "finished") {
    if (game.winner === "draw") return `Even harvest by ${game.endReason || "draw"}.`;
    if (game.endReason === "abandoned") return `${sideLabel(game.winner)} wins by resignation.`;
    return `${sideLabel(game.winner)} wins by ${game.endReason || "checkmate"}.`;
  }
  if (!game.white?.name || !game.black?.name) return "Waiting for another grower to take a seat.";
  if (isMyTurn()) return "Your turn.";
  return `${state.chess.turn() === "w" ? "Light side" : "Dark side"} to move.`;
}

function sideLabel(side) {
  if (side === "white") return "Light side";
  if (side === "black") return "Dark side";
  if (side === "spectator") return "Spectator";
  if (side === "draw") return "Draw";
  return "Room";
}

function findCheckedKing() {
  if (!state.chess.inCheck()) return null;
  const color = state.chess.turn();
  for (const rank of whiteRanks) {
    for (const file of files) {
      const square = `${file}${rank}`;
      const piece = state.chess.get(square);
      if (piece?.type === "k" && piece.color === color) return square;
    }
  }
  return null;
}

function inviteUrl(code) {
  const url = new URL(window.location.href);
  url.hash = "";
  url.search = "";
  url.searchParams.set("code", code);
  return url.toString();
}

async function getJson(path) {
  const response = await fetch(`${API_BASE}/${path}`, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });
  return parseResponse(response);
}

async function postJson(path, body) {
  const response = await fetch(`${API_BASE}/${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  return parseResponse(response);
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || `Request failed with ${response.status}`);
  }
  return payload.game || payload;
}

function pieceName(piece) {
  const names = {
    k: "king",
    q: "queen",
    r: "rook",
    b: "bishop",
    n: "knight",
    p: "pawn"
  };
  return `${piece.color === "w" ? "light" : "dark"} ${names[piece.type]}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}

  return fallbackCopy(text);
}

function fallbackCopy(text) {
  const input = document.createElement("textarea");
  try {
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    input.style.pointerEvents = "none";
    document.body.appendChild(input);
    input.select();
    input.setSelectionRange(0, text.length);
    return document.execCommand?.("copy") === true;
  } catch {
    return false;
  } finally {
    input.remove();
  }
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    els.toast.classList.remove("visible");
  }, 3200);
}

function showError(err) {
  console.error(err);
  showToast(err.message || "Something went wrong.");
}
