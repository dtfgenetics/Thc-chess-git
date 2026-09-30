(() => {
  const nativeFetch = window.fetch.bind(window);

  window.fetch = (input, init = {}) => {
    if (typeof input !== "string" && !(input instanceof URL)) {
      return nativeFetch(input, init);
    }

    const url = new URL(String(input), window.location.href);
    if (!url.pathname.endsWith("/api/get-game.php")) {
      return nativeFetch(input, init);
    }

    const legacyToken = url.searchParams.get("token");
    if (!legacyToken) {
      return nativeFetch(input, init);
    }

    url.searchParams.delete("token");
    const headers = new Headers(init.headers || {});
    if (!headers.has("X-KKC-Player-Token")) {
      headers.set("X-KKC-Player-Token", legacyToken);
    }

    return nativeFetch(url.toString(), { ...init, headers });
  };
})();
