/**
 * Shared helpers for list-page FilterBar options and client-side filtering.
 */

export const STATUS_FILTER_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

export const STATUS_FILTER_FIELD = {
  key: "status",
  label: "Status",
  type: "select",
  multiple: true,
  options: STATUS_FILTER_OPTIONS,
};

/** Build unique { value, label } options from list rows. */
export const buildUniqueSelectOptions = (rows, getValue, getLabel) => {
  const seen = new Map();
  const resolveLabel = getLabel ?? getValue;

  rows.forEach((row) => {
    const value = getValue(row);
    if (value == null || value === "" || value === "—") return;
    const key = String(value);
    if (seen.has(key)) return;
    const label = resolveLabel(row);
    seen.set(key, {
      value: key,
      label: String(label ?? value),
    });
  });

  return [...seen.values()].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
  );
};

/** True when no filter is set or the item value is in the selected set. */
export const matchesMultiSelectFilter = (filterValues, itemValue) => {
  if (
    filterValues == null ||
    filterValues === "" ||
    (Array.isArray(filterValues) && filterValues.length === 0)
  ) {
    return true;
  }
  const selected = Array.isArray(filterValues) ? filterValues : [filterValues];
  return selected.map(String).includes(String(itemValue));
};

/** Header quick-select (All / Active / Inactive) plus optional FilterBar status. */
export const matchesStatusFilters = (headerStatus, advancedStatus, itemStatus) => {
  const matchesHeader =
    !headerStatus || headerStatus === "All" || itemStatus === headerStatus;
  const matchesAdvanced = matchesMultiSelectFilter(advancedStatus, itemStatus);
  return matchesHeader && matchesAdvanced;
};

/**
 * Query params for list APIs (status, search, pagination).
 * Backend may ignore unknown params; client-side filtering still applies.
 */
/**
 * Query params for list APIs.
 * @param {object} options
 * @param {boolean} [options.withPagination=false] - When false (default), only status/search are sent so client-side pagination still works on the full result set.
 */
export const buildListQueryParams = ({
  filterStatus,
  searchTerm,
  pageNo,
  rowsPerPage,
  withPagination = false,
} = {}) => {
  const params = {};

  if (withPagination) {
    if (pageNo != null) params.page = pageNo;
    if (rowsPerPage != null) params.limit = rowsPerPage;
  }

  const search = searchTerm?.trim();
  if (search) params.search = search;

  if (filterStatus && filterStatus !== "All") {
    params.status = filterStatus.toLowerCase();
  }

  return params;
};

/**
 * Apply FilterBar field rules against one row.
 * @param {object} item - mapped list row
 * @param {object} filters - applied FilterBar values
 * @param {Array<{ key: string, getValue: (item) => unknown }>} rules
 */
export const applyAdvancedFilters = (item, filters, rules = []) => {
  if (!filters || typeof filters !== "object") return true;

  return rules.every((rule) => {
    const filterVal = filters[rule.key];
    if (
      filterVal == null ||
      filterVal === "" ||
      (Array.isArray(filterVal) && filterVal.length === 0)
    ) {
      return true;
    }
    return matchesMultiSelectFilter(filterVal, rule.getValue(item));
  });
};

/**
 * Calculate count of active filters.
 * @param {object} filters
 * @returns {number}
 */
export const getActiveFiltersCount = (filters) => {
  if (!filters || typeof filters !== "object") return 0;
  return Object.keys(filters).reduce((count, key) => {
    const val = filters[key];
    if (val != null && val !== "" && (!Array.isArray(val) || val.length > 0)) {
      return count + 1;
    }
    return count;
  }, 0);
};

export const normalizeListQueryFilters = (filters = {}) =>
  Object.entries(filters).reduce((result, [key, value]) => {
    if (Array.isArray(value)) {
      if (value.length) result[key] = value.join(",");
    } else if (value != null && value !== "") {
      result[key] = value;
    }
    return result;
  }, {});
