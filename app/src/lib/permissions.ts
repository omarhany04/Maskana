import type { Role } from "@real-estate-crm/shared";

export function isAdmin(role: Role) {
  return role === "ADMIN";
}

export function isManager(role: Role) {
  return role === "MANAGER";
}

export function isAgent(role: Role) {
  return role === "AGENT";
}

export function isManagerOrAdmin(role: Role) {
  return role === "ADMIN" || role === "MANAGER";
}

