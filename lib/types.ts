import { LucideIcon } from "lucide-react";

export interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  link: string;
  color: string;
  id: string;
}

export type UserType = "patient" | "doctor";

export interface SignInConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  color: {
    bg: string;
    text: string;
    border: string;
    button: string;
    link: string;
  };
}

export interface RouteConfig {
  LANDING: string;
  SIGNIN: string;
  PATIENT: string;
  DOCTOR: string;
  OVERVIEW: string;
  FEATURES: {
    LAB_ANALYSIS: string;
    SCHEDULING: string;
    BILL_NEGOTIATION: string;
    CLAIMS: string;
  };
}

export interface Appointment {
  time: string;
  patient: string;
  type: string;
  status: "Confirmed" | "Waiting" | "Pending";
}

export interface PatientStatus {
  label: string;
  value: number;
  count: string;
  change: string;
  color: string;
}

