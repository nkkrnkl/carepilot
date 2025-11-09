import { CaseData } from "@/lib/types/cases";

export type SampleLabParameter = {
  name: string;
  value: number | string;
  unit?: string | null;
  referenceRange?: string | null;
};

export type SampleLabReport = {
  id: string;
  title: string;
  date: string;
  doctor?: string | null;
  hospital?: string | null;
  summary?: string;
  parameters: SampleLabParameter[];
};

export type SampleAppointment = {
  id: string;
  appointmentDate: string; // ISO string
  appointmentTime?: string | null;
  appointmentType: "in-person" | "telehealth";
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "rescheduled" | "no_show" | "waiting";
  doctorName?: string | null;
  location?: string | null;
  notes?: string | null;
  preparation?: string | null;
};

export const SAMPLE_LAB_REPORTS: SampleLabReport[] = [
  {
    id: "lab-a1c-2024-10-12",
    title: "Metabolic Panel",
    date: new Date().toISOString(),
    doctor: "Dr. Angela Smith",
    hospital: "Mount Sinai Primary Care",
    summary: "Your Hemoglobin A1C is slightly above your personalized target range.",
    parameters: [
      {
        name: "Hemoglobin A1C",
        value: 6.1,
        unit: "%",
        referenceRange: "<5.7",
      },
      {
        name: "LDL Cholesterol",
        value: 138,
        unit: "mg/dL",
        referenceRange: "<130",
      },
      {
        name: "HDL Cholesterol",
        value: 58,
        unit: "mg/dL",
        referenceRange: "40-60",
      },
    ],
  },
];

export const SAMPLE_APPOINTMENTS: SampleAppointment[] = [
  {
    id: "apt-upcoming-1",
    appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    appointmentTime: "09:30",
    appointmentType: "in-person",
    status: "confirmed",
    doctorName: "Dr. Priya Patel",
    location: "Downtown Medical Center, Suite 315",
    notes: "Annual physical exam",
    preparation: "Arrive 15 minutes early for paperwork. Fasting labs already completed.",
  },
  {
    id: "apt-upcoming-2",
    appointmentDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    appointmentTime: "14:15",
    appointmentType: "telehealth",
    status: "scheduled",
    doctorName: "Dr. Alan Chen",
    location: "Virtual visit",
    notes: "Follow-up: medication adjustment",
  },
];

export const SAMPLE_CASES: CaseData[] = [
  {
    id: "case-eob-1001",
    type: "EOB",
    status: "Needs Review",
    title: "Bill vs. EOB mismatch",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    amount: 200,
    provider: "City Imaging Center",
    insurance: "Aetna",
    description: "Provider billed $200, but EOB shows patient responsibility of $50.",
    alert: "Mismatch detected",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    claim_number: "CLM-45872",
    total_billed: 200,
    total_benefits_approved: 150,
    services_count: 1,
    member_name: "Jordan Lee",
    group_number: "AET-4452",
    member_id: "JL-2088",
  },
  {
    id: "case-bill-2040",
    type: "Bill",
    status: "In Progress",
    title: "Out-of-network lab charge",
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    amount: 320,
    provider: "Quest Diagnostics",
    insurance: "Cigna",
    description: "Lab was billed as out-of-network despite referral.",
    alert: "Negotiation underway",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    claim_number: "CLM-88231",
    total_billed: 320,
    total_benefits_approved: 0,
    services_count: 3,
    member_name: "Jordan Lee",
    group_number: "CIG-2235",
    member_id: "JL-2088",
  },
];
