/** Light feedback when matched ores break; Telegram client or short vibrate. */
export function hapticGemBreak() {
  const tg = window.Telegram?.WebApp;
  if (tg?.HapticFeedback?.impactOccurred) {
    try {
      tg.HapticFeedback.impactOccurred('light');
      return;
    } catch {
      /* ignore */
    }
  }
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(10);
    }
  } catch {
    /* ignore */
  }
}
