const EMPTY_VALUES = new Set(["", "-", "—", "â€”", null, undefined]);

const normalizeTableValue = (value) => {
  if (EMPTY_VALUES.has(value)) return { empty: true, value: "" };

  if (typeof value === "number") return { empty: false, value };

  const text = String(value).trim();
  const numericText = text.replace(/[₹â‚¹,%\s,]/g, "");
  if (numericText !== "" && Number.isFinite(Number(numericText))) {
    return { empty: false, value: Number(numericText) };
  }

  const timestamp = Date.parse(text);
  if (
    Number.isFinite(timestamp) &&
    /[-/]|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(text)
  ) {
    return { empty: false, value: timestamp };
  }

  return { empty: false, value: text.toLowerCase() };
};

export const sortTableRows = (rows, sortConfig) => {
  if (!sortConfig?.key || !sortConfig?.direction) return rows;

  return [...rows].sort((leftRow, rightRow) => {
    const left = normalizeTableValue(leftRow[sortConfig.key]);
    const right = normalizeTableValue(rightRow[sortConfig.key]);

    if (left.empty && right.empty) return 0;
    if (left.empty) return 1;
    if (right.empty) return -1;

    const comparison =
      typeof left.value === "number" && typeof right.value === "number"
        ? left.value - right.value
        : String(left.value).localeCompare(String(right.value), undefined, {
            numeric: true,
            sensitivity: "base",
          });

    return sortConfig.direction === "asc" ? comparison : -comparison;
  });
};

export const getNextSortConfig = (current, key) => {
  if (current.key !== key) return { key, direction: "asc" };
  if (current.direction === "asc") return { key, direction: "desc" };
  return { key: null, direction: null };
};
