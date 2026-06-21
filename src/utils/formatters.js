import dayjs from "dayjs";

/**
 * Formats a date value for display in the UI.
 * @param {string|number|Date} value - The date value to format.
 * @returns {string} - The formatted date string or "—" if invalid.
 */
export const formatDisplayDate = (value) => {
  if (value == null || value === "") return "—";
  const d = dayjs(value);
  return d.isValid() ? d.format("DD/MM/YYYY") : String(value);
};

/**
 * Normalizes a status value to "Active" or "Inactive".
 * @param {any} value - The status value to normalize.
 * @returns {string} - "Active" or "Inactive".
 */
export const toListStatus = (value) => {
  if (value === true || value === 1) return "Active";
  if (value === false || value === 0) return "Inactive";
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (s === "active" || s === "1") return "Active";
    if (s === "inactive" || s === "0" || s === "disabled") return "Inactive";
    if (value === "Active" || value === "Inactive") return value;
  }
  return "Active";
};

/** Populated client `{ bankName }` from Mongoose, or a plain id string. */
export const formatClientRef = (ref, empty = "") =>
  ref == null || ref === ""
    ? empty
    : typeof ref === "object"
      ? String(
          ref.bankName ??
            ref.bank_name ??
            ref.client_name ??
            ref.clientName ??
            ref.name ??
            empty,
        )
      : String(ref);
