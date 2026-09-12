"use client";

import { SessionContext } from "@/context/session";
import type { Game } from "@chessu/types";
import { useContext } from "react";

import GamePage from "./GamePage";
import VisibleTurnAlert from "./VisibleTurnAlert";

export default function GameAuthWrapper({ initialLobby }: { initialLobby: Game }) {
  const session = useContext(SessionContext);

  if (!session?.user || !session.user?.id) {
    return (
      <section className="kush-session-loading" role="status" aria-live="polite">
        <div className="kush-session-loading__mark" aria-hidden="true">♔</div>
        <p className="kush-session-loading__eyebrow">Kush Kings Chess</p>
        <h1>Preparing the grow room</h1>
        <p>Connecting your grower profile and match seat…</p>
      </section>
    );
  }

  return (
    <div className="kush-game-shell-v2" data-arena="kush-kings">
      <VisibleTurnAlert />
      <GamePage initialLobby={initialLobby} />
    </div>
  );
}
