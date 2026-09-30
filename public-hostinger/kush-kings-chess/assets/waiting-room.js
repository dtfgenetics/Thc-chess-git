const API_BASE = "./api";
const TOKEN_KEY = "kkc_player_token";

const button = document.getElementById("cancel-waiting-room");
let checking = false;
let observedStatus = null;

if (button) {
  button.addEventListener("click", () => {
    cancelWaitingRoom().catch((error) => {
      console.error(error);
      button.disabled = false;
      button.textContent = "Cancel Waiting Room";
      window.alert(error.message || "Could not cancel this waiting room.");
    });
  });

  const observer = new MutationObserver(handleStatusChange);
  observer.observe(document.body, { attributes: true, attributeFilter: ["data-game-status"] });
  handleStatusChange();
}

function handleStatusChange() {
  const status = document.body.dataset.gameStatus || "setup";
  if (status === observedStatus) return;
  observedStatus = status;

  refreshVisibility().catch(() => {
    button.hidden = true;
  });
}

function roomCode() {
  return new URL(window.location.href).searchParams.get("code")?.trim().toUpperCase() || "";
}

function playerToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

async function currentRoom() {
  const code = roomCode();
  const token = playerToken();
  if (!code || !token) return null;

  const response = await fetch(`${API_BASE}/get-game.php?code=${encodeURIComponent(code)}`, {
    headers: {
      Accept: "application/json",
      "X-KKC-Player-Token": token
    },
    cache: "no-store"
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || "Could not load the waiting room.");
  }
  return payload.game || payload;
}

async function refreshVisibility() {
  if (!button || checking) return;
  if (document.body.dataset.gameStatus !== "waiting") {
    button.hidden = true;
    return;
  }

  checking = true;
  try {
    const game = await currentRoom();
    button.hidden = !(game && game.status === "waiting" && (game.side === "white" || game.side === "black"));
  } finally {
    checking = false;
  }
}

async function cancelWaitingRoom() {
  if (!button) return;
  const code = roomCode();
  const token = playerToken();
  if (!code || !token) throw new Error("No waiting room is loaded.");
  if (!window.confirm("Cancel this waiting room? The invite code will stop working.")) return;

  button.disabled = true;
  button.textContent = "Cancelling…";

  const response = await fetch(`${API_BASE}/cancel-room.php`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ code, token })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || "Could not cancel this waiting room.");
  }

  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  window.location.assign(`${url.pathname}${url.search}${url.hash}`);
}
