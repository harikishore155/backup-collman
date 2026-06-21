export const DUMMY_BANK_OPTIONS = [
  { label: "SBI", value: "dummy_bank_sbi" },
  { label: "HDFC Bank", value: "dummy_bank_hdfc" },
  { label: "ICICI Bank", value: "dummy_bank_icici" },
];

export const DUMMY_LOCATION_OPTIONS = [
  { label: "RJPM", value: "RJPM" },
  { label: "Mumbai", value: "Mumbai" },
  { label: "Chennai", value: "Chennai" },
  { label: "Delhi", value: "Delhi" },
];

export const DUMMY_BRANCH_OPTIONS = [
  { label: "Chennai", value: "Chennai" },
  { label: "Mumbai", value: "Mumbai" },
  { label: "Delhi", value: "Delhi" },
  { label: "Bangalore", value: "Bangalore" },
];

export const DUMMY_PRODUCT_OPTIONS = [
  { label: "Personal Loan", value: "6a016c946f6f216f86d1a451" },
  { label: "Credit Card", value: "dummy_product_cc" },
  { label: "Home Loan", value: "dummy_product_hl" },
];

export const DUMMY_EMPLOYEE_OPTIONS = [
  { label: "Amit Sharma (TC)", value: "6a0ac9b784a50e53907bb589" },
  { label: "Priya Nair (Employee)", value: "dummy_employee_priya" },
  { label: "Rahul Mehta (TC)", value: "dummy_employee_rahul" },
];

export const DUMMY_BOSS_OPTIONS = [
  { label: "Rajesh Kumar (MD)", value: "dummy_boss_rajesh" },
  { label: "Meera Patel (Boss)", value: "dummy_boss_meera" },
];

export const DUMMY_ASST_MANAGER_OPTIONS = [
  { label: "Suresh Iyer (AM)", value: "dummy_am_suresh" },
  { label: "Kavita Rao (AM)", value: "dummy_am_kavita" },
];

export const DUMMY_TL_OPTIONS = [
  { label: "Vikram Singh (TL)", value: "6a06bf572ea2271d1185e924" },
  { label: "Anita Desai (TL)", value: "dummy_tl_anita" },
];

export const ensureSelectOptions = (options, fallbacks) =>
  Array.isArray(options) && options.length > 0 ? options : fallbacks;
