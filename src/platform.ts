// Picks the one set of Price check setup steps that fits the visitor's device.

export type Platform = 'ios-safari' | 'ios-other' | 'android' | 'desktop';

export const PLATFORM_LABELS: Record<Platform, string> = {
  'ios-safari': 'iPhone or iPad, Safari',
  'ios-other': 'iPhone or iPad, Brave, Chrome or another browser',
  android: 'Android phone',
  desktop: 'Computer',
};

export function detectPlatform(userAgent: string, maxTouchPoints = 0, isBrave = false): Platform {
  // iPads ask for desktop sites and report as a Mac with a touch screen.
  const ios = /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
  if (ios) return isBrave || /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(userAgent) ? 'ios-other' : 'ios-safari';
  if (/Android/.test(userAgent)) return 'android';
  return 'desktop';
}
