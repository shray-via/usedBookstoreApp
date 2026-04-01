export const extractIsbn = (input = "") => {
  const normalized = String(input).trim();
  if (!normalized) return "";

  const matches = normalized.match(/(97[89][0-9]{10}|[0-9]{9}[0-9Xx])/g);
  if (!matches || matches.length === 0) return "";

  const preferred = matches.find((value) => value.length === 13) ?? matches[0];
  return preferred.toUpperCase();
};

export const normalizeIsbn = (input = "") => {
  const compact = String(input).replace(/[^0-9Xx]/g, "").toUpperCase();
  if (compact.length === 10 || compact.length === 13) return compact;
  return "";
};
