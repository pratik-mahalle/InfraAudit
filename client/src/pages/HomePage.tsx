import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

// Brand logos
import { SiMeta, SiOpenai } from "react-icons/si";
import { BsMicrosoft } from "react-icons/bs";
import { FaCube } from "react-icons/fa";

const HomePage = () => {
  return (
    <div className="min-h-screen hero-gradient">
      {/* Header */}
      <header className="w-full py-4 px-6 md:px-12 header-blur fixed top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <span className="text-2xl font-bold text-gradient">CloudGuard</span>
              </div>
            </Link>
            <nav className="hidden md:flex ml-10 space-x-8">
              <Link href="/features"><span className="text-sm text-gray-300 hover:text-white cursor-pointer">Features</span></Link>
              <Link href="/solutions"><span className="text-sm text-gray-300 hover:text-white cursor-pointer">Solutions</span></Link>
              <Link href="/pricing"><span className="text-sm text-gray-300 hover:text-white cursor-pointer">Pricing</span></Link>
              <Link href="/docs"><span className="text-sm text-gray-300 hover:text-white cursor-pointer">Documentation</span></Link>
              <Link href="/customers"><span className="text-sm text-gray-300 hover:text-white cursor-pointer">Customers</span></Link>
              <Link href="/resources"><span className="text-sm text-gray-300 hover:text-white cursor-pointer">Resources</span></Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth">
              <span className="text-sm text-gray-300 hover:text-white cursor-pointer">Log in</span>
            </Link>
            <Link href="/auth">
              <Button className="btn-gradient" size="sm">
                Start for free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-28 md:pt-40 px-6 md:px-0">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Powering AI With<br />
            The Best Data &<br />
            Infrastructure
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            AI-powered cloud cost analysis and security alerts in
            just a few clicks. Complete infrastructure monitoring at scale.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button className="btn-gradient px-8 py-6 text-lg">
              Start a free trial
            </Button>
            <Button variant="outline" className="px-8 py-6 text-lg border-gray-700 bg-gray-900/50 hover:bg-gray-800/50">
              See live demo
            </Button>
          </div>
        </div>

        {/* Trusted By Section */}
        <div className="mt-24 md:mt-40 max-w-5xl mx-auto">
          <p className="text-sm text-center text-gray-500 mb-10">
            Scales easily with Companies of all Sizes, Government Agencies & Enterprises
          </p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-8">
            <SiMeta className="h-8 w-auto text-gray-400" />
            <BsMicrosoft className="h-8 w-auto text-gray-400" />
            <SiOpenai className="h-8 w-auto text-gray-400" />
            <FaCube className="h-8 w-auto text-gray-400" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;