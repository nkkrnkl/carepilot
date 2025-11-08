import { CheckCircle2 } from "lucide-react";
import { BENEFITS } from "@/lib/constants";

interface BenefitsSectionProps {
  title?: string;
  description?: string;
  benefits?: readonly string[];
}

export function BenefitsSection({
  title = "Why CarePilot?",
  description = "Built with transparency and control at the core",
  benefits = BENEFITS,
}: BenefitsSectionProps) {
  return (
    <section className="bg-blue-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{description}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm"
            >
              <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <span className="text-gray-700 font-medium">{benefit}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

