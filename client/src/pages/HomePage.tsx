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
            <a href="#features" className="text-gray-400 hover:text-white text-sm">Features</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Cost Management</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Security</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Integrations</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Cloud Providers</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Documentation</a>
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
              Intelligent Cloud<br />
              Infrastructure<br />
              Monitoring
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-xl">
              Monitor and optimize your multi-cloud environment with AI-powered 
              cost anomaly detection and security drift monitoring.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link to="/auth">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full">
                  Get started
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 px-6 py-2 rounded-full">
                  Explore features
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Cloud Providers Section */}
      <section className="container mx-auto px-6 py-16 relative z-10">
        <div className="text-center mb-10">
          <p className="text-sm text-gray-400">Seamlessly monitor and manage all major cloud providers in one dashboard</p>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          <div className="flex flex-col items-center text-gray-400">
            <CloudIcon className="h-8 w-8 mb-2" />
            <span className="text-sm">Amazon Web Services</span>
          </div>
          <div className="flex flex-col items-center text-gray-400">
            <Server className="h-8 w-8 mb-2" />
            <span className="text-sm">Microsoft Azure</span>
          </div>
          <div className="flex flex-col items-center text-gray-400">
            <Database className="h-8 w-8 mb-2" />
            <span className="text-sm">Google Cloud Platform</span>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section id="features" className="container mx-auto px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 p-6 rounded-lg border border-blue-700/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-800/50 p-2 rounded-md">
                <BarChart3 className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold">Cost Optimization</h3>
            </div>
            <p className="text-gray-400">AI-powered cost anomaly detection that identifies wasted resources and predicts future spending trends.</p>
          </div>
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 p-6 rounded-lg border border-purple-700/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-800/50 p-2 rounded-md">
                <Shield className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold">Security Monitoring</h3>
            </div>
            <p className="text-gray-400">Real-time detection of security configuration drifts and vulnerabilities across all your cloud resources.</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-900/40 to-indigo-800/20 p-6 rounded-lg border border-indigo-700/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-800/50 p-2 rounded-md">
                <CloudIcon className="h-5 w-5 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold">Multi-Cloud Support</h3>
            </div>
            <p className="text-gray-400">Unified dashboard for AWS, Azure, and GCP with intelligent resource tracking and utilization metrics.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-16 mb-16 relative z-10">
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-xl p-8 md:p-12 border border-blue-700/30">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to gain control over your cloud infrastructure?</h2>
            <p className="text-gray-300 mb-8">CloudGuard helps you monitor costs, detect security issues, and optimize resources across all major cloud providers.</p>
            <Link to="/auth">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full">
                Start monitoring now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-xl font-bold mb-4">CloudGuard</div>
              <p className="text-gray-400 text-sm">Intelligent infrastructure monitoring for modern cloud environments.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white text-sm">Features</a></li>
                <li><Link to="/auth" className="text-gray-400 hover:text-white text-sm">Cost Management</Link></li>
                <li><Link to="/auth" className="text-gray-400 hover:text-white text-sm">Security</Link></li>
                <li><Link to="/auth" className="text-gray-400 hover:text-white text-sm">Multi-Cloud</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><Link to="/auth" className="text-gray-400 hover:text-white text-sm">Documentation</Link></li>
                <li><Link to="/auth" className="text-gray-400 hover:text-white text-sm">API Reference</Link></li>
                <li><Link to="/auth" className="text-gray-400 hover:text-white text-sm">Blog</Link></li>
                <li><Link to="/auth" className="text-gray-400 hover:text-white text-sm">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/auth" className="text-gray-400 hover:text-white text-sm">About Us</Link></li>
                <li><Link to="/auth" className="text-gray-400 hover:text-white text-sm">Careers</Link></li>
                <li><Link to="/auth" className="text-gray-400 hover:text-white text-sm">Privacy Policy</Link></li>
                <li><Link to="/auth" className="text-gray-400 hover:text-white text-sm">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-500 mb-4 md:mb-0">© 2025 CloudGuard. All rights reserved.</div>
            <div className="flex gap-4">
              <Link to="/auth" className="text-gray-400 hover:text-white">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              <Link to="/auth" className="text-gray-400 hover:text-white">
                <span className="sr-only">GitHub</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </Link>
              <Link to="/auth" className="text-gray-400 hover:text-white">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;