import type { WorkTypeSetting } from "../types";

export const fallbackWorkTypes: WorkTypeSetting[] = [
  {
    label: "직접 고용",
    enabled: true,
    payrollDocumentsRequired: true,
    sortOrder: 10,
  },
  {
    label: "외부 고용",
    enabled: true,
    payrollDocumentsRequired: false,
    sortOrder: 20,
  },
];
