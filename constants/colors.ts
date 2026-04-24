const Colors = {
  primary: "#1a2f4a",
  accent: "#e8a020",
  background: "#faf8f5",
  surface: "#ffffff",
  ink: "#1a1a1a",
  secondary: "#6b7280",
} as const;

export const URGENCY_COLORS: Record<
  "CRITICAL" | "EMERGENCY" | "URGENT" | "ROUTINE",
  string
> = {
  CRITICAL: "#dc2626",
  EMERGENCY: "#ea580c",
  URGENT: "#e8a020",
  ROUTINE: "#16a34a",
};

export const STATUS_COLORS: Record<
  "Submitted" | "Assigned" | "In Progress" | "Completed",
  string
> = {
  Submitted: "#2563eb",
  Assigned: "#7c3aed",
  "In Progress": "#d97706",
  Completed: "#16a34a",
};

export default Colors;
