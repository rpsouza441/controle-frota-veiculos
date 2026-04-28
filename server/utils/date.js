export function toIsoMinute(value) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 16) + "Z";
}

export function dbDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error("Data invalida.");
    error.status = 400;
    throw error;
  }
  return date.toISOString().slice(0, 19).replace("T", " ");
}
