export type Role = "resident" | "maintenance_staff" | "admin";

export type ComplaintStatus =
  | "pending"
  | "in_progress"
  | "resolved"
  | "completed";

export type Category =
  | "plumbing"
  | "electrical"
  | "cleaning"
  | "appliance"
  | "other";

export type Priority = "low" | "medium" | "high";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Complaint {
  id: string;
  public_id: string;
  resident_id: string;
  category: Category;
  priority: Priority;
  description: string;
  status: ComplaintStatus;
  assigned_staff_id: string | null;
  images: string[];
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  resident_feedback: string | null;
  rating: number | null;
}

export interface AnalyticsSummary {
  by_category: { category: string; count: number }[];
}
