export const USER_ROLES = ["admin", "developer", "designer", "content", "pm"] as const;
export type UserRole = (typeof USER_ROLES)[number];
