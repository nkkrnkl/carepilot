#!/usr/bin/env python3
"""
Dashboard Builder
=================

This script aggregates information produced by the Lab, Scheduling, and
Billing/Claims agents and emits a single JSON payload that can power the
homepage dashboard described in the product brief.

The script is designed to be invoked directly from the command line or via the
existing Next.js python bridge (`lib/python-bridge.ts`).  It gathers data from
agent outputs (JSON files for now, with hooks to replace by SQL or API calls
later), enriches the records, and produces the structure the React dashboard
expects:

    {
      "userId": "...",
      "generatedAt": "...",
      "needsAttention": [...],
      "commandBar": {...},
      "quickAccess": {...},
      "shortcuts": [...]
    }

Future integration points (SQL Server, LangGraph workflows, etc.) are marked so
you can replace the stub loaders with real data sources without changing the
shape of the output consumed by the frontend.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple


ROOT_DIR = Path(__file__).resolve().parent.parent  # repository root (/workspace)
FIXTURES_DIR = ROOT_DIR / "fixtures"


# --------------------------------------------------------------------------- #
# Helper dataclasses                                                          #
# --------------------------------------------------------------------------- #


@dataclass
class LabParameter:
    name: str
    value: Any
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    status: Optional[str] = None  # normal | low | high | unknown


@dataclass
class LabReport:
    id: str
    title: str
    date: str
    hospital: Optional[str]
    doctor: Optional[str]
    parameters: List[LabParameter] = field(default_factory=list)
    raw: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Appointment:
    appointment_id: str
    doctor_name: Optional[str]
    appointment_date: datetime
    appointment_time: Optional[str]
    appointment_type: Optional[str]
    status: Optional[str]
    confirmation_code: Optional[str]
    estimated_cost: Optional[float]
    notes: Optional[str]
    raw: Dict[str, Any] = field(default_factory=dict)


@dataclass
class CaseRecord:
    id: str
    type: str
    status: str
    title: str
    date: str
    amount: Optional[float]
    provider: Optional[str]
    insurance: Optional[str]
    description: Optional[str]
    alert: Optional[str]
    discrepancies: List[str] = field(default_factory=list)
    amount_you_owe: Optional[float] = None
    total_benefits_approved: Optional[float] = None
    raw: Dict[str, Any] = field(default_factory=dict)


# --------------------------------------------------------------------------- #
# Utility functions                                                           #
# --------------------------------------------------------------------------- #


def parse_reference_range(range_str: Optional[str]) -> Optional[Tuple[Optional[float], Optional[float]]]:
    """
    Parse a reference range string into numeric lower/upper bounds when possible.
    Supports formats like "0.6-1.2", "70 – 110", "< 140", "> 3.5", etc.
    """
    if not range_str:
        return None

    cleaned = range_str.strip().lower().replace("–", "-").replace("—", "-")

    if cleaned.startswith("<"):
        try:
            return None, float(cleaned.lstrip("< ").strip())
        except ValueError:
            return None

    if cleaned.startswith(">"):
        try:
            return float(cleaned.lstrip("> ").strip()), None
        except ValueError:
            return None

    if "-" in cleaned:
        left, right = cleaned.split("-", 1)
        try:
            return float(left.strip()), float(right.strip())
        except ValueError:
            return None

    # Fallback: extract numbers
    nums = []
    temp = ""
    for char in cleaned:
        if char.isdigit() or char == ".":
            temp += char
        else:
            if temp:
                nums.append(temp)
                temp = ""
    if temp:
        nums.append(temp)

    if len(nums) >= 2:
        try:
            values = sorted(float(n) for n in nums)
            return values[0], values[-1]
        except ValueError:
            return None

    return None


def determine_parameter_status(value: Any, reference_range: Optional[str]) -> str:
    """
    Determine whether a lab parameter is low/high/normal relative to the provided range.
    """
    if reference_range is None:
        return "unknown"

    try:
        numeric_value = float(value)
    except (TypeError, ValueError):
        return "unknown"

    bounds = parse_reference_range(reference_range)
    if not bounds:
        return "unknown"

    lower, upper = bounds
    if lower is not None and numeric_value < lower:
        return "low"
    if upper is not None and numeric_value > upper:
        return "high"

    if lower is not None and upper is not None and lower <= numeric_value <= upper:
        return "normal"
    if lower is not None and numeric_value >= lower:
        return "normal"
    if upper is not None and numeric_value <= upper:
        return "normal"

    return "unknown"


def load_json_file(path: Path) -> Optional[Any]:
    """
    Safely load a JSON file if it exists.
    """
    if not path.exists():
        return None
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON in {path}: {exc}") from exc


def to_datetime(value: Any) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


# --------------------------------------------------------------------------- #
# Data loaders                                                                #
# --------------------------------------------------------------------------- #


class DataLoader:
    """
    Provides helper methods to source agent output. These use file-based
    fallbacks today, but can be swapped with SQL queries or API calls.
    """

    def __init__(self, user_id: str):
        self.user_id = user_id

    # -- Lab reports -------------------------------------------------------- #

    def load_lab_reports(self) -> List[LabReport]:
        """
        Load lab reports for the user.

        Search order:
          1. project root `lab_reports_<user_id>.json`
          2. `backend/data/lab_reports/<user_id>.json`
          3. fixtures fallback (`fixtures/labs/cbc_sample.json`)
        """
        candidate_paths = [
            ROOT_DIR / f"lab_reports_{self.user_id}.json",
            ROOT_DIR / "backend" / "data" / "lab_reports" / f"{self.user_id}.json",
        ]

        payload = None
        for path in candidate_paths:
            payload = load_json_file(path)
            if payload:
                break

        if payload is None:
            # Use fixtures fallback to ensure UI can render placeholder data.
            payload = load_json_file(FIXTURES_DIR / "labs" / "cbc_sample.json")

        if payload is None:
            return []

        # Normalize to list
        if isinstance(payload, dict):
            reports_raw: List[Dict[str, Any]] = [payload]
        else:
            reports_raw = list(payload)  # type: ignore[arg-type]

        reports: List[LabReport] = []
        for idx, raw in enumerate(reports_raw, start=1):
            parameters = []
            for param in raw.get("parameters", []):
                lab_param = LabParameter(
                    name=param.get("name") or f"Parameter {len(parameters) + 1}",
                    value=param.get("value"),
                    unit=param.get("unit"),
                    reference_range=param.get("referenceRange"),
                )
                lab_param.status = determine_parameter_status(
                    lab_param.value,
                    lab_param.reference_range,
                )
                parameters.append(lab_param)

            report = LabReport(
                id=raw.get("id") or f"lab-{idx}",
                title=raw.get("title") or "Lab Report",
                date=raw.get("date") or datetime.utcnow().date().isoformat(),
                hospital=raw.get("hospital"),
                doctor=raw.get("doctor"),
                parameters=parameters,
                raw=raw,
            )
            reports.append(report)

        return reports

    # -- Appointments ------------------------------------------------------- #

    def load_appointments(self) -> List[Appointment]:
        """
        Load upcoming appointments.

        Search order:
          1. `appointments_<user_id>.json` at repo root
          2. `backend/data/appointments/<user_id>.json`
          3. fallback sample (two appointments next week)
        """
        candidate_paths = [
            ROOT_DIR / f"appointments_{self.user_id}.json",
            ROOT_DIR / "backend" / "data" / "appointments" / f"{self.user_id}.json",
        ]

        payload = None
        for path in candidate_paths:
            payload = load_json_file(path)
            if payload:
                break

        if payload is None:
            today = datetime.utcnow().date()
            payload = [
                {
                    "appointment_id": "apt-sample-1",
                    "doctorName": "Dr. Smith",
                    "appointmentDate": f"{today}T09:30:00Z",
                    "appointmentType": "in-person",
                    "status": "scheduled",
                    "confirmationCode": "CONF-DEMO-1234",
                    "estimatedCost": 120.0,
                },
                {
                    "appointment_id": "apt-sample-2",
                    "doctorName": "Dr. Chen",
                    "appointmentDate": f"{today + timedelta(days=2)}T14:00:00Z",
                    "appointmentType": "telehealth",
                    "status": "scheduled",
                    "confirmationCode": "CONF-DEMO-5678",
                    "estimatedCost": 0.0,
                },
            ]

        appointments: List[Appointment] = []
        for raw in payload:
            appointment_date = to_datetime(raw.get("appointmentDate")) or datetime.utcnow()
            appointments.append(
                Appointment(
                    appointment_id=raw.get("appointment_id") or raw.get("id") or "unknown",
                    doctor_name=raw.get("doctorName") or raw.get("doctor_id"),
                    appointment_date=appointment_date,
                    appointment_time=raw.get("appointmentTime"),
                    appointment_type=raw.get("appointmentType"),
                    status=raw.get("status"),
                    confirmation_code=raw.get("confirmationCode"),
                    estimated_cost=raw.get("estimatedCost"),
                    notes=raw.get("notes"),
                    raw=raw,
                )
            )

        return sorted(appointments, key=lambda appt: appt.appointment_date)

    # -- Cases / Billing ---------------------------------------------------- #

    def load_case_records(self) -> List[CaseRecord]:
        """
        Load case records generated by the billing & claims agent.

        Search order:
          1. `eob_output_all_<user_id>.json` (same file consumed by /api/cases)
          2. `backend/data/cases/<user_id>.json`
          3. fallback sample
        """
        candidate_paths = [
            ROOT_DIR / f"eob_output_all_{self.user_id}.json",
            ROOT_DIR / "backend" / "data" / "cases" / f"{self.user_id}.json",
        ]

        payload = None
        for path in candidate_paths:
            payload = load_json_file(path)
            if payload:
                break

        if payload is None:
            payload = {
                "total_documents": 1,
                "results": [
                    {
                        "document_id": "bill-demo-1",
                        "case_data": {
                            "id": "case-demo-1",
                            "type": "Bill",
                            "status": "Needs Review",
                            "title": "Review ER Bill from Mercy Hospital",
                            "date": datetime.utcnow().date().isoformat(),
                            "amount": 200.0,
                            "provider": "Mercy Hospital",
                            "insurance": "Aetna PPO",
                            "description": "AI detected a mismatch between bill and EOB.",
                            "alert": "Discrepancy detected",
                        },
                        "eob_data": {
                            "amount_you_owe": 50.0,
                            "total_benefits_approved": 150.0,
                            "alerts": ["Provider billed $200, EOB owes $50"],
                            "discrepancies": ["Bill exceeds EOB responsibility by $150"],
                        },
                    }
                ],
            }

        results: List[CaseRecord] = []
        result_entries = payload.get("results", []) if isinstance(payload, dict) else payload

        for entry in result_entries:
            case_data = entry.get("case_data", {})
            eob_data = entry.get("eob_data", {})
            record = CaseRecord(
                id=case_data.get("id") or entry.get("document_id") or "case-unknown",
                type=case_data.get("type") or "Bill",
                status=case_data.get("status") or "In Progress",
                title=case_data.get("title") or "Review Case",
                date=case_data.get("date") or datetime.utcnow().date().isoformat(),
                amount=case_data.get("amount"),
                provider=case_data.get("provider"),
                insurance=case_data.get("insurance"),
                description=case_data.get("description"),
                alert=case_data.get("alert"),
                discrepancies=[
                    *(case_data.get("discrepancies") or []),
                    *(eob_data.get("discrepancies") or []),
                ],
                amount_you_owe=eob_data.get("amount_you_owe"),
                total_benefits_approved=eob_data.get("total_benefits_approved"),
                raw=entry,
            )
            results.append(record)

        return results


# --------------------------------------------------------------------------- #
# Aggregation logic                                                           #
# --------------------------------------------------------------------------- #


class DashboardBuilder:
    def __init__(self, user_id: str, loader: Optional[DataLoader] = None):
        self.user_id = user_id
        self.loader = loader or DataLoader(user_id)

    # -- Public API --------------------------------------------------------- #

    def build_payload(self) -> Dict[str, Any]:
        labs = self.loader.load_lab_reports()
        appointments = self.loader.load_appointments()
        cases = self.loader.load_case_records()

        payload = {
            "userId": self.user_id,
            "generatedAt": datetime.utcnow().isoformat(),
            "needsAttention": self._build_attention_cards(labs, cases, appointments),
            "commandBar": self._build_command_bar(),
            "quickAccess": self._build_quick_access(labs, cases, appointments),
            "shortcuts": self._build_shortcuts(),
        }

        recent_activity = self._build_recent_activity(labs, cases, appointments)
        if recent_activity:
            payload["quickAccess"]["recentActivity"] = recent_activity

        return payload

    # -- Section builders --------------------------------------------------- #

    def _build_attention_cards(
        self,
        labs: Iterable[LabReport],
        cases: Iterable[CaseRecord],
        appointments: Iterable[Appointment],
    ) -> List[Dict[str, Any]]:
        cards: List[Dict[str, Any]] = []

        # Labs: flag out-of-range parameters
        for report in labs:
            for param in report.parameters:
                if param.status in ("high", "low"):
                    trend = "elevated" if param.status == "high" else "trending low"
                    cards.append(
                        {
                            "id": f"lab-{report.id}-{param.name}",
                            "type": "lab",
                            "title": f"{param.name}: {trend.title()}",
                            "body": (
                                f"{param.name} measured {param.value}{param.unit or ''}, "
                                f"outside the reference range ({param.reference_range})."
                            ),
                            "metadata": {
                                "reportTitle": report.title,
                                "reportDate": report.date,
                                "status": param.status,
                            },
                            "cta": {
                                "label": "View Plain-English Analysis",
                                "href": f"/features/lab-analysis?reportId={report.id}",
                            },
                        }
                    )

        # Cases: highlight items needing review or with discrepancies
        for case in cases:
            if case.status.lower() in {"needs review", "pending"} or case.discrepancies:
                discrepancy = case.discrepancies[0] if case.discrepancies else case.alert
                cards.append(
                    {
                        "id": f"case-{case.id}",
                        "type": "case",
                        "title": case.title,
                        "body": discrepancy or case.description or "Case requires your review.",
                        "metadata": {
                            "status": case.status,
                            "amount": case.amount,
                            "amountYouOwe": case.amount_you_owe,
                            "provider": case.provider,
                        },
                        "cta": {
                            "label": "Start Dispute" if case.type.lower() == "bill" else "Review Claim",
                            "href": f"/features/claims?caseId={case.id}",
                        },
                    }
                )

        # Appointments: upcoming within 48 hours
        now = datetime.utcnow()
        soon = now + timedelta(hours=48)
        for appointment in appointments:
            if now <= appointment.appointment_date <= soon:
                cards.append(
                    {
                        "id": f"appointment-{appointment.appointment_id}",
                        "type": "appointment",
                        "title": f"Appointment with {appointment.doctor_name or 'your provider'}",
                        "body": appointment.appointment_date.strftime(
                            "Prep reminder for %A at %I:%M %p"
                        ),
                        "metadata": {
                            "appointmentType": appointment.appointment_type,
                            "status": appointment.status,
                            "confirmationCode": appointment.confirmation_code,
                        },
                        "cta": {
                            "label": "View Details",
                            "href": f"/features/scheduling?appointmentId={appointment.appointment_id}",
                        },
                    }
                )

        return cards

    def _build_command_bar(self) -> Dict[str, Any]:
        return {
            "ghostText": "How can I help? (e.g., \"Book a physical\", \"Dispute this bill\", \"Explain my labs\")",
            "suggestions": [
                {"label": "Analyze my latest labs", "prompt": "Explain my latest lab results"},
                {"label": "Dispute a medical bill", "prompt": "Dispute this bill"},
                {"label": "Book a follow-up visit", "prompt": "Schedule a follow-up appointment"},
            ],
        }

    def _build_quick_access(
        self,
        labs: Iterable[LabReport],
        cases: Iterable[CaseRecord],
        appointments: Iterable[Appointment],
    ) -> Dict[str, Any]:
        upcoming = [
            {
                "id": appt.appointment_id,
                "provider": appt.doctor_name or "Provider",
                "date": appt.appointment_date.isoformat(),
                "status": appt.status,
                "type": appt.appointment_type,
                "confirmationCode": appt.confirmation_code,
            }
            for appt in list(appointments)[:2]
        ]

        active_cases = [case for case in cases if case.status.lower() != "resolved"]
        estimated_savings = sum(
            max((case.amount or 0) - (case.amount_you_owe or 0), 0) for case in active_cases
        )

        quick_access = {
            "upcomingAppointments": upcoming,
            "activeCases": {
                "count": len(active_cases),
                "estimatedSavings": round(estimated_savings, 2),
            },
        }

        if labs:
            latest_report = max(
                labs,
                key=lambda report: to_datetime(report.date) or datetime.min,
            )
            quick_access["latestLab"] = {
                "title": latest_report.title,
                "date": latest_report.date,
                "doctor": latest_report.doctor,
                "abnormalCount": sum(1 for p in latest_report.parameters if p.status in {"high", "low"}),
            }

        return quick_access

    def _build_recent_activity(
        self,
        labs: Iterable[LabReport],
        cases: Iterable[CaseRecord],
        appointments: Iterable[Appointment],
    ) -> List[Dict[str, Any]]:
        recent: List[Dict[str, Any]] = []

        for report in labs:
            recent.append(
                {
                    "id": f"activity-lab-{report.id}",
                    "type": "lab",
                    "description": f"Uploaded lab report: {report.title}",
                    "date": report.date,
                }
            )

        for case in cases:
            recent.append(
                {
                    "id": f"activity-case-{case.id}",
                    "type": "case",
                    "description": f"{case.status} case: {case.title}",
                    "date": case.date,
                }
            )

        for appt in appointments:
            recent.append(
                {
                    "id": f"activity-appointment-{appt.appointment_id}",
                    "type": "appointment",
                    "description": f"Confirmed appointment with {appt.doctor_name or 'provider'}",
                    "date": appt.appointment_date.isoformat(),
                }
            )

        # Sort descending by date/time
        recent.sort(key=lambda item: item.get("date") or "", reverse=True)
        return recent[:6]

    @staticmethod
    def _build_shortcuts() -> List[Dict[str, Any]]:
        return [
            {"id": "shortcut-labs", "label": "Analyze Labs", "href": "/features/lab-analysis"},
            {"id": "shortcut-schedule", "label": "Schedule", "href": "/features/scheduling"},
            {"id": "shortcut-bill", "label": "Review Bill", "href": "/features/billing"},
            {"id": "shortcut-claims", "label": "Manage Claim", "href": "/features/claims"},
        ]


# --------------------------------------------------------------------------- #
# CLI entry point                                                             #
# --------------------------------------------------------------------------- #


def main() -> None:
    parser = argparse.ArgumentParser(description="Build dashboard payload for a user.")
    parser.add_argument("--user-id", required=False, default="user-123", help="User identifier / email")
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        help="Optional path to write the JSON payload. Prints to stdout when omitted.",
    )
    args = parser.parse_args()

    builder = DashboardBuilder(user_id=args.user_id)
    payload = builder.build_payload()

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with args.output.open("w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2)
        print(f"Dashboard payload written to {args.output}")
    else:
        print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
