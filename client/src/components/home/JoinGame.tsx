"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useContext, useState } from "react";

import { SessionContext } from "@/context/session";
import { fetchActiveGame } from "@/lib/game";
import { parseRoomInvite } from "@/lib/roomCode";

export default function JoinGame() {
  const session = useContext(SessionContext);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const router = useRouter();

  function showJoinError() {
    setNotFound(true);
    setTimeout(() => setNotFound(false), 5000);
  }

  async function submitJoinGame(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session?.user?.id) return;

    const target = e.target as HTMLFormElement;
    const codeEl = target.elements.namedItem("joinGameCode") as HTMLInputElement;
    const code = parseRoomInvite(codeEl.value);

    if (!code) {
      showJoinError();
      return;
    }

    setButtonLoading(true);
    const game = await fetchActiveGame(code);

    if (game && game.code) {
      router.push(`/${game.code}`);
    } else {
      setButtonLoading(false);
      showJoinError();
      codeEl.value = "";
    }
  }

  return (
    <form
      className={"input-group" + (notFound ? " tooltip tooltip-error tooltip-open" : "")}
      data-tip="Invalid invite or session not found"
      onSubmit={submitJoinGame}
    >
      <input
        type="text"
        placeholder="Invite link or session code"
        className="input input-bordered"
        name="joinGameCode"
        id="joinGameCode"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
      />
      <button
        className={
          "btn btn-secondary" +
          (buttonLoading ? " loading" : "") +
          (!session?.user?.id ? " btn-disabled text-base-content" : "")
        }
        type="submit"
      >
        Join Session
      </button>
    </form>
  );
}
