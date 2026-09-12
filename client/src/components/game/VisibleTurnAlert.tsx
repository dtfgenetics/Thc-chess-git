"use client";

import { useEffect, useState } from "react";

const TURN_TITLE_PREFIX = "(your turn)";

function titleSignalsLocalTurn(title: string) {
  return title.trim().toLowerCase().startsWith(TURN_TITLE_PREFIX);
}

export default function VisibleTurnAlert() {
  const [isYourTurn, setIsYourTurn] = useState(false);

  useEffect(() => {
    const title = document.querySelector("title");
    const sync = () => setIsYourTurn(titleSignalsLocalTurn(document.title));

    sync();
    if (!title) return undefined;

    const observer = new MutationObserver(sync);
    observer.observe(title, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  if (!isYourTurn) return null;

  return (
    <div
      className="fixed left-1/2 top-20 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-primary/60 bg-base-200/95 px-4 py-2 shadow-xl backdrop-blur sm:top-24"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-kush-turn-alert="your-turn"
    >
      <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_14px_hsl(var(--p))]" aria-hidden="true" />
      <span className="whitespace-nowrap text-xs font-black tracking-[0.14em] text-base-content">YOUR MOVE</span>
      <span className="hidden text-xs text-base-content/70 sm:inline">Select a piece to see legal moves.</span>
    </div>
  );
}

export { titleSignalsLocalTurn };
