/** True for phones, tablets, and other non-computer devices. */
export function isNonComputer(): boolean {
  const nav = navigator as Navigator & {
    userAgentData?: { mobile?: boolean };
    platform?: string;
  };

  if (nav.userAgentData?.mobile) return true;

  const ua = navigator.userAgent || "";
  if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua)) {
    return true;
  }
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return true;

  // iPadOS 13+ reports as Macintosh
  if (nav.platform === "MacIntel" && navigator.maxTouchPoints > 1) return true;

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const noHover = window.matchMedia("(hover: none)").matches;
  const shortSide = Math.min(window.innerWidth, window.innerHeight);
  if (coarse && noHover && shortSide < 760) return true;

  return false;
}
