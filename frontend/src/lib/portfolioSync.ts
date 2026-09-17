/**
 * A small same-origin notification channel for portfolio-content writes.
 *
 * The admin and public site are routes in the same Vite application. A
 * successful admin save can therefore notify an already-open public tab
 * immediately, without polling the full portfolio endpoint or reloading the
 * document. `storage` is retained as a fallback for browsers without
 * BroadcastChannel support.
 */
const CHANNEL_NAME = "anirudh-portfolio-content";
const STORAGE_KEY = "anirudh-portfolio-content-revision";

export const PORTFOLIO_CHANGED_EVENT = "portfolio-content-changed";

export function notifyPortfolioChanged(): void {
  if (typeof window === "undefined") return;

  const revision = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  // BroadcastChannel and the storage event do not notify the window that
  // published the message, so notify it directly as well.
  window.dispatchEvent(new Event(PORTFOLIO_CHANGED_EVENT));

  try {
    localStorage.setItem(STORAGE_KEY, revision);
  } catch {
    // Private browsing can deny storage. BroadcastChannel still works there.
  }

  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(revision);
    channel.close();
  }
}

export function subscribeToPortfolioChanges(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  window.addEventListener(PORTFOLIO_CHANGED_EVENT, onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY && event.newValue) onChange();
  };
  window.addEventListener("storage", onStorage);

  const channel = "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL_NAME) : null;
  if (channel) channel.onmessage = onChange;

  return () => {
    window.removeEventListener(PORTFOLIO_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
    channel?.close();
  };
}
