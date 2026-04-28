export function apiLog(level, event, details = {}) {
  const payload = Object.entries(details).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== "") acc[key] = value;
    return acc;
  }, {});
  const line = `[fleet-api] ${event}`;
  if (level === "error") {
    console.error(line, payload);
    return;
  }
  if (level === "warn") {
    console.warn(line, payload);
    return;
  }
  console.log(line, payload);
}
