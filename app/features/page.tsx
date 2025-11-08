import Link from "next/link";

export default function FeaturesPage() {
  const features = [
    {
      title: "Bill Negotiation",
      href: "/features/bill-negotiation",
      description: "Negotiate and manage medical bills"
    },
    {
      title: "Claims Processing",
      href: "/features/claims",
      description: "Process and track insurance claims"
    },
    {
      title: "Lab Analysis",
      href: "/features/lab-analysis",
      description: "Analyze and understand lab results"
    },
    {
      title: "Appointment Scheduling",
      href: "/features/scheduling",
      description: "Schedule appointments with healthcare providers"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">CarePilot Features</h1>
        <p className="text-lg text-gray-600 mb-12">
          Explore our AI-powered healthcare navigation tools
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h2>
              <p className="text-gray-600">{feature.description}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
