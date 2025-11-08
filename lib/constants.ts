import { 
  Beaker,
  FileText,
  LucideIcon,
  Stethoscope,
  User
} from "lucide-react";

export interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  link: string;
  color: string;
  id: string;
}

export const FEATURES: Feature[] = [
  {
    id: "lab-analysis",
    title: "Lab Analysis",
    description: "Parse common labs, track trends and deltas, flag out-of-range values with plain-English context and suggested questions for your clinician.",
    icon: Beaker,
    link: "/features/lab-analysis",
    color: "bg-blue-100 text-blue-600"
  },
  {
    id: "cases",
    title: "Case Management",
    description: "Track and manage all your bills, EOBs, and claims in one place. Review cases, track progress, and take action when needed.",
    icon: FileText,
    link: "/features/cases",
    color: "bg-purple-100 text-purple-600"
  }
] as const;

export const BENEFITS = [
  "Fully auditable actions",
  "User-approved operations",
  "AI-powered automation",
  "Time-saving efficiency",
  "Cost reduction",
  "Peace of mind"
] as const;

export const ROUTES = {
  LANDING: "/",
  SIGNIN: "/signin",
  PATIENT: "/patient",
  DOCTOR: "/doctorportal",
  OVERVIEW: "/overview",
  FEATURES: {
    LAB_ANALYSIS: "/features/lab-analysis",
    CASES: "/features/cases"
  }
} as const;

export type UserType = "patient" | "doctor";

export const USER_TYPES = {
  PATIENT: "patient" as const,
  DOCTOR: "doctor" as const,
} as const;

export const SIGN_IN_CONFIG = {
  patient: {
    icon: User,
    title: "Patient Portal",
    description: "Access your health records, appointments, and care management tools",
    color: {
      bg: "bg-blue-100",
      text: "text-blue-600",
      border: "border-blue-300",
      button: "bg-blue-600 hover:bg-blue-700",
      link: "text-blue-600",
    },
  },
  doctor: {
    icon: Stethoscope,
    title: "Doctor Portal",
    description: "Access your practice dashboard, patient records, and clinical tools",
    color: {
      bg: "bg-green-100",
      text: "text-green-600",
      border: "border-green-300",
      button: "bg-green-600 hover:bg-green-700",
      link: "text-green-600",
    },
  },
} as const;
