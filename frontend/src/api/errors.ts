import { isAxiosError } from "axios";

/** Extract HTTP status and human-readable detail from API errors. */
export function apiErrorDetail(
  error: unknown,
  fallback: string,
): { status?: number; message: string } {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as unknown;
    let message = fallback;
    if (data && typeof data === "object" && "detail" in data) {
      const d = (data as { detail: unknown }).detail;
      if (typeof d === "string") message = d;
      else if (Array.isArray(d) && d[0] && typeof d[0] === "object" && "msg" in d[0]) {
        message = String((d[0] as { msg: unknown }).msg);
      }
    }
    return typeof status === "number" ? { status, message } : { message };
  }
  return { message: fallback };
}
