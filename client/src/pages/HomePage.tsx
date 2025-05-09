import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CloudIcon, Database, Shield, BarChart3, Server } from "lucide-react";

export function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Navigation */}
      <header className="container mx-auto py-4 px-6">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-white">CloudGuard</div>
          <nav className="hidden md:flex gap-6 items-center">
            <a href="#" className="text-gray-400 hover:text-white text-sm">Features</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Solutions</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Integrations</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Governance</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Customers</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Resources</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="link" className="text-white">Log In</Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 text-sm">
                Start for free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Gradient Background with Blur Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-indigo-900/40 to-purple-900/20 z-0"></div>
        
        {/* Purple/Blue Blob Effect */}
        <div className="absolute top-[20%] left-[10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-r from-blue-600/30 to-purple-600/30 blur-[80px] z-0"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-gradient-to-r from-indigo-600/20 to-blue-600/20 blur-[100px] z-0"></div>
        
        <div className="container mx-auto px-6 py-24 md:py-32 relative z-10">
          <div className="max-w-3xl mx-auto md:ml-0 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Powering AI With<br />
              The Best Data &<br />
              Infrastructure
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-xl">
              Full visibility into your cloud costs & security risks. 
              AI-powered anomaly detection for cost control at scale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link to="/auth">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full">
                  Build a free account
                </Button>
              </Link>
              <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 px-6 py-2 rounded-full">
                Learn more
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="container mx-auto px-6 py-16 relative z-10">
        <div className="text-center mb-10">
          <p className="text-sm text-gray-400">Global leaders work with CloudGuard for AI infrastructure management</p>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          <div className="flex flex-col items-center text-gray-400">
            <CloudIcon className="h-8 w-8 mb-2" />
            <span className="text-sm">AWS</span>
          </div>
          <div className="flex flex-col items-center text-gray-400">
            <Server className="h-8 w-8 mb-2" />
            <span className="text-sm">Azure</span>
          </div>
          <div className="flex flex-col items-center text-gray-400">
            <Database className="h-8 w-8 mb-2" />
            <span className="text-sm">GCP</span>
          </div>
          <div className="text-xl font-semibold text-gray-400">OpenAI</div>
          <div className="text-xl font-semibold text-gray-400">Cohere</div>
          <div className="text-xl font-semibold text-gray-400">Anthropic</div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="container mx-auto px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 p-6 rounded-lg border border-blue-700/30">
            <h3 className="text-xl font-semibold mb-3">Cost Optimization</h3>
            <p className="text-gray-400">AI-powered cost anomaly detection that finds waste and recommends improvements.</p>
          </div>
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 p-6 rounded-lg border border-purple-700/30">
            <h3 className="text-xl font-semibold mb-3">Security Monitoring</h3>
            <p className="text-gray-400">Real-time detection of security drifts and configuration risks across clouds.</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-900/40 to-indigo-800/20 p-6 rounded-lg border border-indigo-700/30">
            <h3 className="text-xl font-semibold mb-3">Multi-Cloud Support</h3>
            <p className="text-gray-400">Centralized management for AWS, Azure, GCP and other cloud providers.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-16 mb-16 relative z-10">
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-xl p-8 md:p-12 border border-blue-700/30">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to optimize your cloud infrastructure?</h2>
            <p className="text-gray-300 mb-8">Join thousands of companies using CloudGuard to reduce costs and improve security.</p>
            <Link to="/auth">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full">
                Get started for free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-xl font-bold mb-4 md:mb-0">CloudGuard</div>
            <div className="text-sm text-gray-500">© 2025 CloudGuard. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;