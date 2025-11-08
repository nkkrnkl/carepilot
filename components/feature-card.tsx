import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Feature } from "@/lib/constants";
import { FEATURE_DESCRIPTIONS } from "@/lib/feature-descriptions";

interface FeatureCardProps {
  feature: Feature;
  showLearnMore?: boolean;
  variant?: "default" | "detailed";
}

export function FeatureCard({ feature, showLearnMore = true, variant = "default" }: FeatureCardProps) {
  const Icon = feature.icon;

  if (variant === "detailed") {
    return (
      <Card className="border-2 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-lg ${feature.color} flex items-center justify-center`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">{feature.title}</CardTitle>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        {showLearnMore && (
          <CardContent>
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                {FEATURE_DESCRIPTIONS[feature.title] || `Get started with ${feature.title.toLowerCase()}`}
              </div>
              <Button asChild variant="outline">
                <Link href={feature.link} className="flex items-center gap-2">
                  Learn more
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card className="border-2 hover:border-blue-300 transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-4 mb-2">
          <div className={`h-12 w-12 rounded-lg ${feature.color} flex items-center justify-center`}>
            <Icon className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">{feature.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-gray-600 text-base mb-4">{feature.description}</CardDescription>
        {showLearnMore && (
          <Button asChild variant="link" className="p-0 h-auto font-semibold text-blue-600 hover:text-blue-700">
            <Link href={feature.link} className="flex items-center gap-2">
              Learn more
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

