"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

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
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 overflow-hidden">
      {/* Animated background gradient */}
      <div 
        className="absolute inset-0 -z-10 opacity-30"
        style={{
          background: `radial-gradient(circle at ${50 + mousePosition.x * 0.5}% ${50 + mousePosition.y * 0.5}%, rgba(59, 130, 246, 0.15), rgba(96, 165, 250, 0.15), transparent 70%)`,
          transition: 'background 0.3s ease-out',
        }}
      />
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />

      <div className="text-center relative z-10">
        {badge && (
          <div 
            className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6 transition-all duration-1000 shadow-lg ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
          >
            <span className="animate-spin-slow inline-block">{badge.icon || <Sparkles className="h-4 w-4" />}</span>
            {badge.text}
          </div>
        )}
        <h1 
          className={`text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="block bg-gradient-to-r from-gray-900 via-blue-700 to-blue-600 bg-clip-text text-transparent animate-gradient">
            {title.primary}
          </div>
          <div 
            className={`block ${title.secondaryColor || "text-blue-600"} mt-2 text-3xl lg:text-4xl`}
            style={{
              animation: 'slideInUp 0.8s ease-out 0.4s both',
            }}
          >
            {title.secondary}
          </div>
        </h1>
        <p 
          className={`text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-400 italic ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {description}
        </p>
        {cta && (
          <div 
            className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-600 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <Button 
              asChild 
              size="lg" 
              className="text-lg px-8 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Link href={cta.primary.href}>{cta.primary.text}</Link>
            </Button>
            {cta.secondary && (
              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 border-2 hover:bg-blue-50 transform hover:scale-105 transition-all duration-300"
              >
                <Link href={cta.secondary.href}>{cta.secondary.text}</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
