"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
  blue: "bg-gradient-to-r from-blue-600 to-blue-500",
  green: "bg-gradient-to-r from-green-600 to-green-700",
  purple: "bg-gradient-to-r from-blue-600 to-blue-500",
};

export function CTASection({
  title,
  description,
  primaryAction,
  secondaryAction,
  variant = "blue",
}: CTASectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div 
        className={`${variantStyles[variant]} rounded-2xl p-12 text-center text-white relative overflow-hidden transform transition-all duration-1000 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px',
            animation: 'backgroundMove 15s linear infinite',
          }} />
        </div>

        {/* Shine effect */}
        <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] hover:translate-x-[200%] transition-transform duration-1000" />

        <div className="relative z-10">
          <h2 
            className={`text-4xl lg:text-5xl font-bold mb-4 transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {title}
          </h2>
          <p 
            className={`text-xl mb-8 text-white/90 max-w-2xl mx-auto transition-all duration-1000 delay-400 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {description}
          </p>
          <div 
            className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-600 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <Button 
              asChild 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8 bg-white text-blue-600 hover:bg-blue-50 transform hover:scale-110 transition-all duration-300 shadow-xl hover:shadow-2xl"
            >
              <Link href={primaryAction.href}>{primaryAction.text}</Link>
            </Button>
            {secondaryAction && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-lg px-8 bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 transform hover:scale-110 transition-all duration-300"
              >
                <Link href={secondaryAction.href}>{secondaryAction.text}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
