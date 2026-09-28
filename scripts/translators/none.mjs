/** Default translator. Copies English and marks the result as machine output. */
export const id = "none";

export async function translate(fields) {
  return {
    engine: "none",
    model: null,
    fields,
    note: "No translator configured. Hindi fields are still the English source and must be replaced before publishing.",
  };
}
