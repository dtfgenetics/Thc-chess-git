"use client";

import { SessionContext } from "@/context/session";
import type { Game } from "@chessu/types";
import { useContext } from "react";

import GamePage from "./GamePage";

export default function GameAuthWrapper({ initialLobby }: { initialLobby: Game }) {
  const session = useContext(SessionContext);

  if (!session?.user || !session.user?.id) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="text-2xl font-bold">Preparing the grow room</div>
        <div className="text-xl">Waiting for your grower profile...</div>
      </div>
    );
  }

  return <GamePage initialLobby={initialLobby} />;
}
