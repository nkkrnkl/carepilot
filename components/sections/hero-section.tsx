import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles } from "lucide-react";

interface HeroSectionProps {
  badge?: {
    text: string;
    icon?: React.ReactNode;
  };
  title: {
    primary: string;
    secondary: string;
    secondaryColor?: string;
  };
  description: string;
  cta?: {
    primary: {
      text: string;
      href: string;
    };
    secondary?: {
      text: string;
      href: string;
    };
  };
}

export function HeroSection({
  badge,
  title,
  description,
  cta,
}: HeroSectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
      <div className="text-center">
        {badge && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6">
            {badge.icon || <Sparkles className="h-4 w-4" />}
            {badge.text}
          </div>
        )}
        <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          <div className="block">{title.primary}</div>
          <div className={`block ${title.secondaryColor || "text-blue-600"}`}>
            {title.secondary}
          </div>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
          {description}
        </p>
        {cta && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href={cta.primary.href}>{cta.primary.text}</Link>
            </Button>
            {cta.secondary && (
              <Button asChild size="lg" variant="outline" className="text-lg px-8">
                <Link href={cta.secondary.href}>{cta.secondary.text}</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

