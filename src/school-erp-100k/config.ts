export const APP_CONFIG = {
  name: "School ERP Reporting Suite",
  version: "2.0.0",
  apiBaseUrl: "/api",
  pageSize: 25,
  currency: "INR",
  timezone: "Asia/Kolkata",
  features: {
    attendance: true,
    fees: true,
    exams: true,
    analytics: true,
    notifications: true,
    reports: true,
    audit: true,
  },
} as const;

export type FeatureFlag = keyof typeof APP_CONFIG.features;
export function featureEnabled(flag: FeatureFlag): boolean {
  return APP_CONFIG.features[flag];
}
