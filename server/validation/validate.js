export function validate(schema, payload) {
  const result = schema.safeParse(payload);
  if (result.success) return result.data;
  const error = new Error(result.error.issues.map((issue) => issue.message).join(" "));
  error.status = 400;
  throw error;
}
