"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SignUpCard } from "@/components/auth/sign-up-card";
import { USER_TYPES, SIGN_IN_CONFIG, ROUTES } from "@/lib/constants";
import type { UserType } from "@/lib/constants";

export default function SignUpPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType | null>(null);
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");

  const handleSignUp = (type: UserType) => {
    // TODO: Add actual sign-up logic (API call, validation, etc.)
    // For now, just navigate to the respective dashboard
    if (type === USER_TYPES.DOCTOR) {
      router.push("/doctorportal");
    } else if (type === USER_TYPES.PATIENT) {
      router.push(ROUTES.PATIENT);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <h1 className="text-3xl font-bold text-gray-900">CarePilot</h1>
          </Link>
          <p className="text-gray-600">Create an account to get started</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <SignUpCard
            userType={USER_TYPES.PATIENT}
            icon={SIGN_IN_CONFIG.patient.icon}
            title={SIGN_IN_CONFIG.patient.title}
            description={SIGN_IN_CONFIG.patient.description}
            color={SIGN_IN_CONFIG.patient.color}
            name={patientName}
            email={patientEmail}
            onNameChange={setPatientName}
            onEmailChange={setPatientEmail}
            onUserTypeSelect={() => setUserType(USER_TYPES.PATIENT)}
            onSignUp={() => handleSignUp(USER_TYPES.PATIENT)}
          />

          <SignUpCard
            userType={USER_TYPES.DOCTOR}
            icon={SIGN_IN_CONFIG.doctor.icon}
            title={SIGN_IN_CONFIG.doctor.title}
            description={SIGN_IN_CONFIG.doctor.description}
            color={SIGN_IN_CONFIG.doctor.color}
            name={doctorName}
            email={doctorEmail}
            onNameChange={setDoctorName}
            onEmailChange={setDoctorEmail}
            onUserTypeSelect={() => setUserType(USER_TYPES.DOCTOR)}
            onSignUp={() => handleSignUp(USER_TYPES.DOCTOR)}
          />
        </div>

        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/signin" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign In
            </Link>
          </p>
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 block">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

