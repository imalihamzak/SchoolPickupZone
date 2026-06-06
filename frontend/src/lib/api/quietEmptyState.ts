const QUIET_EMPTY_STATE_CODES = new Set([
  "DOCUMENT_VERIFICATION_REQUIRED",
  "FEATURE_DISABLED",
  "PACKAGE_REQUIRED",
]);

const QUIET_EMPTY_STATE_MESSAGES = [
  "document approval is required",
  "documents need approval",
  "is not enabled for the current package",
  "no package is assigned to this school",
];

const readPayload = (value: any) => value?.response?.data || value?.data || value;

const readMessage = (value: any) => {
  const payload = readPayload(value);
  return String(payload?.error || payload?.message || value?.message || "").toLowerCase();
};

export function isQuietEmptyStatePayload(payload: unknown) {
  const data = readPayload(payload);
  const code = String(data?.code || "");
  if (QUIET_EMPTY_STATE_CODES.has(code)) return true;

  const message = readMessage(payload);
  return QUIET_EMPTY_STATE_MESSAGES.some((fragment) => message.includes(fragment));
}

export function isQuietEmptyStateError(error: unknown) {
  return isQuietEmptyStatePayload(error);
}

export function isQuietEmptyStateResponse(response: Response, payload?: unknown) {
  if (response.ok) return false;
  return isQuietEmptyStatePayload(payload);
}
