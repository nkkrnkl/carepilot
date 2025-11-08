"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SignInCard } from "@/components/auth/sign-in-card";
import { USER_TYPES, SIGN_IN_CONFIG, ROUTES } from "@/lib/constants";
import type { UserType } from "@/lib/constants";

export default function SignInPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType | null>(null);
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPassword, setPatientPassword] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [doctorPassword, setDoctorPassword] = useState("");

  const handleSignIn = (type: UserType) => {
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
          <p className="text-gray-600">Sign in to access your dashboard</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SignInCard
            userType={USER_TYPES.PATIENT}
            icon={SIGN_IN_CONFIG.patient.icon}
            title={SIGN_IN_CONFIG.patient.title}
            description={SIGN_IN_CONFIG.patient.description}
            color={SIGN_IN_CONFIG.patient.color}
            email={patientEmail}
            password={patientPassword}
            onEmailChange={setPatientEmail}
            onPasswordChange={setPatientPassword}
            onUserTypeSelect={() => setUserType(USER_TYPES.PATIENT)}
            onSignIn={() => handleSignIn(USER_TYPES.PATIENT)}
          />

          <SignInCard
            userType={USER_TYPES.DOCTOR}
            icon={SIGN_IN_CONFIG.doctor.icon}
            title={SIGN_IN_CONFIG.doctor.title}
            description={SIGN_IN_CONFIG.doctor.description}
            color={SIGN_IN_CONFIG.doctor.color}
            email={doctorEmail}
            password={doctorPassword}
            onEmailChange={setDoctorEmail}
            onPasswordChange={setDoctorPassword}
            onUserTypeSelect={() => setUserType(USER_TYPES.DOCTOR)}
            onSignIn={() => handleSignIn(USER_TYPES.DOCTOR)}
          />
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
