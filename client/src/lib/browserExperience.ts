type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    // Type-signature parameters are part of the Web API contract.
    // eslint-disable-next-line no-unused-vars
    request(type: 'screen'): Promise<WakeLockSentinelLike>;
  };
};

type WakeLockSentinelLike = {
  released?: boolean;
  release(): Promise<void>;
  // eslint-disable-next-line no-unused-vars
  addEventListener?(type: 'release', listener: () => void): void;
};

export type ShareLinkResult = "shared" | "copied" | "cancelled" | "failed";

export async function copyText(text: string): Promise<boolean> {
  const value = String(text || "");
  if (!value) return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Clipboard access can be blocked; fall back to the DOM copy path below.
  }

  try {
    const field = document.createElement("textarea");
    field.value = value;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    field.style.pointerEvents = "none";
    document.body.append(field);
    field.select();
    field.setSelectionRange(0, value.length);
    const copied = document.execCommand?.("copy") === true;
    field.remove();
    return copied;
  } catch {
    return false;
  }
}

export async function shareOrCopyLink({
  title,
  text,
  url,
  preferShare = true
}: {
  title: string;
  text: string;
  url: string;
  preferShare?: boolean;
}): Promise<ShareLinkResult> {
  if (preferShare && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch (error) {
      if ((error as { name?: string })?.name === "AbortError") return "cancelled";
    }
  }

  return (await copyText(url)) ? "copied" : "failed";
}

export function createScreenWakeLockController() {
  const navigatorObject = navigator as NavigatorWithWakeLock;
  let sentinel: WakeLockSentinelLike | null = null;
  let desired = false;
  let attached = false;

  async function acquire() {
    desired = true;
    if (!navigatorObject.wakeLock?.request || document.visibilityState === "hidden") return false;
    if (sentinel && !sentinel.released) return true;

    try {
      sentinel = await navigatorObject.wakeLock.request("screen");
      sentinel.addEventListener?.("release", () => {
        sentinel = null;
      });
      return true;
    } catch {
      sentinel = null;
      return false;
    }
  }

  async function release() {
    desired = false;
    const current = sentinel;
    sentinel = null;
    if (!current) return true;
    try {
      await current.release();
      return true;
    } catch {
      return false;
    }
  }

  async function onVisibilityChange() {
    if (desired && document.visibilityState === "visible") await acquire();
  }

  function attach() {
    if (attached) return;
    document.addEventListener("visibilitychange", onVisibilityChange);
    attached = true;
  }

  function detach() {
    if (!attached) return;
    document.removeEventListener("visibilitychange", onVisibilityChange);
    attached = false;
  }

  return { acquire, release, attach, detach };
}
