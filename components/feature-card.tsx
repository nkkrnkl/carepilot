"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Feature } from "@/lib/constants";
import { FEATURE_DESCRIPTIONS } from "@/lib/feature-descriptions";
import { useEffect, useRef, useState } from "react";

interface FeatureCardProps {
  feature: Feature;
  showLearnMore?: boolean;
  variant?: "default" | "detailed";
  index?: number;
}

export function FeatureCard({ feature, showLearnMore = true, variant = "default", index = 0 }: FeatureCardProps) {
  const Icon = feature.icon;
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  if (variant === "detailed") {
    return (
      <Card 
        ref={cardRef}
        className={`border-2 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
        style={{
          transitionDelay: `${index * 100}ms`,
        }}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-lg ${feature.color} flex items-center justify-center transform transition-transform duration-300 hover:rotate-12 hover:scale-110`}>
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
              <Button asChild variant="outline" className="group">
                <Link href={feature.link} className="flex items-center gap-2">
                  Learn more
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card 
      ref={cardRef}
      className={`border-2 hover:border-blue-400 transition-all duration-500 hover:shadow-2xl transform hover:-translate-y-3 hover:scale-[1.02] group overflow-hidden relative ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{
        transitionDelay: `${index * 150}ms`,
      }}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-blue-50/0 to-cyan-50/0 group-hover:from-blue-50/50 group-hover:via-blue-50/30 group-hover:to-cyan-50/20 transition-all duration-500" />
      
      <CardHeader className="relative z-10">
        <div className="flex items-center gap-4 mb-2">
          <div className={`h-12 w-12 rounded-lg ${feature.color} flex items-center justify-center transform transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 group-hover:shadow-lg`}>
            <Icon className="h-6 w-6 transition-transform group-hover:scale-110" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {feature.title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <CardDescription className="text-gray-600 text-base mb-4">
          {feature.description}
        </CardDescription>
        {showLearnMore && (
          <Button 
            asChild 
            variant="link" 
            className="p-0 h-auto font-semibold text-blue-600 hover:text-blue-700 group/button"
          >
            <Link href={feature.link} className="flex items-center gap-2">
              Learn more
              <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-2" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
