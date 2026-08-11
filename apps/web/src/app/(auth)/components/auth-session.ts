export type OtpPurpose = "signup" | "reset";

export interface OtpChallenge {
  email: string;
  purpose: OtpPurpose;
  previewUrl: string | null;
  devCode?: string;
  message?: string;
  /** For password reset: verified 6-digit code carried to the reset page. */
  code?: string;
}

const CHALLENGE_KEY = "ps_otp_challenge";

export function saveOtpChallenge(challenge: OtpChallenge) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CHALLENGE_KEY, JSON.stringify(challenge));
}

export function readOtpChallenge(): OtpChallenge | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(CHALLENGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OtpChallenge;
  } catch {
    return null;
  }
}

export function clearOtpChallenge() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CHALLENGE_KEY);
}

export function nextPathFromSearch(search: URLSearchParams | null, fallback = "/dashboard") {
  return search?.get("next") || fallback;
}
