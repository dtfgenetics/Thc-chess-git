const API_BASE = "./api";
const TOKEN_KEY = "kkc_player_token";
const NAME_KEY = "kkc_player_name";

const button = document.getElementById("rematch-room");
let checking = false;
let observedStatus = null;

if (button) {
  button.addEventListener("click", () => {
    createRematch().catch((error) => {
      console.error(error);
      button.disabled = false;
      button.textContent = "Create Rematch Room";
      window.alert(error.message || "Could not create a rematch room.");
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
    throw new Error(payload.error || "Could not load the finished room.");
  }
  return payload.game || payload;
}

async function refreshVisibility() {
  if (!button || checking) return;
  if (document.body.dataset.gameStatus !== "finished") {
    button.hidden = true;
    return;
  }

  checking = true;
  try {
    const game = await currentRoom();
    button.hidden = !(game && game.status === "finished" && (game.side === "white" || game.side === "black"));
  } finally {
    checking = false;
  }
}

async function createRematch() {
  if (!button) return;
  button.disabled = true;
  button.textContent = "Creating…";

  const previous = await currentRoom();
  if (!previous || previous.status !== "finished") {
    throw new Error("Finish the current match before creating a rematch.");
  }
  if (previous.side !== "white" && previous.side !== "black") {
    throw new Error("Only a seated player can create a rematch room.");
  }

  const token = playerToken();
  const name = (localStorage.getItem(NAME_KEY) || "Grower").trim().slice(0, 24) || "Grower";
  const nextSide = previous.side === "white" ? "black" : "white";

  const response = await fetch(`${API_BASE}/create-game.php`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ token, name, side: nextSide, unlisted: false })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || "Could not create a rematch room.");
  }

  const game = payload.game || payload;
  if (!game.code) throw new Error("The rematch room did not return a room code.");

  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("code", game.code);
  window.location.assign(url.toString());
}
