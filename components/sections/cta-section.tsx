import { Button } from "@/components/ui/button";
import Link from "next/link";

interface CTASectionProps {
  title: string;
  description: string;
  primaryAction: {
    text: string;
    href: string;
  };
  secondaryAction?: {
    text: string;
    href: string;
  };
  variant?: "blue" | "green" | "purple";
}

const variantStyles = {
  blue: "bg-gradient-to-r from-blue-600 to-blue-700",
  green: "bg-gradient-to-r from-green-600 to-green-700",
  purple: "bg-gradient-to-r from-purple-600 to-purple-700",
};

export function CTASection({
  title,
  description,
  primaryAction,
  secondaryAction,
  variant = "blue",
}: CTASectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className={`${variantStyles[variant]} rounded-2xl p-12 text-center text-white`}>
        <h2 className="text-4xl font-bold mb-4">{title}</h2>
        <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">{description}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" variant="secondary" className="text-lg px-8">
            <Link href={primaryAction.href}>{primaryAction.text}</Link>
          </Button>
          {secondaryAction && (
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-lg px-8 bg-transparent border-white text-white hover:bg-white hover:text-gray-900"
            >
              <Link href={secondaryAction.href}>{secondaryAction.text}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

