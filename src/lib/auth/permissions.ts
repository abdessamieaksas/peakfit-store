export type AdminRole = "OWNER" | "MANAGER" | "FULFILMENT" | "VIEWER";
export type StaffRole = Exclude<AdminRole, "OWNER">;

export function canManageOrders(role: AdminRole) {
  return role !== "VIEWER";
}

export function canManageCatalog(role: AdminRole) {
  return role === "OWNER" || role === "MANAGER";
}

export function canManageTeam(role: AdminRole) {
  return role === "OWNER";
}
