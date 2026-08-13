import React from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LandingFooter, LandingNav } from "@/pages/HomePage";

interface MainLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export function MainLayout({ children, showFooter = true }: MainLayoutProps) {
  const [location] = useLocation();
  const isLandingPage = location === "/";
  const isMarketingPage = ["/pricing", "/about", "/contact", "/privacy", "/terms"].includes(location);

  if (isLandingPage) {
    return <>{children}</>;
  }

  if (isMarketingPage) {
    return (
      <div className="landing-page marketing-shell">
        <LandingNav />
        <main className="marketing-main">{children}</main>
        <LandingFooter />
      </div>
    );
  }

  if (!showFooter) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-14">{children}</main>
      <Footer />
    </div>
  );
}
