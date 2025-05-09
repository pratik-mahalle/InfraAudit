import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  LayoutDashboard,
  ShieldAlert,
  DollarSign,
  BarChart4,
  Bell,
  Settings,
  User,
  LogOut,
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  
  const links = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Security Monitoring",
      href: "/security",
      icon: ShieldAlert,
    },
    {
      name: "Cost Optimization",
      href: "/cost",
      icon: DollarSign,
    },
    {
      name: "Resource Utilization",
      href: "/resources",
      icon: BarChart4,
    },
    {
      name: "Alerts",
      href: "/alerts",
      icon: Bell,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <aside className="bg-white shadow-md w-64 flex-shrink-0 hidden md:flex md:flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold font-inter text-primary">CloudGuard</h1>
      </div>

      <nav className="py-4 flex-1">
        <ul>
          {links.map((link) => (
            <li key={link.href} className="mb-1">
              <Link href={link.href}>
                <div
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-r-lg cursor-pointer",
                    location === link.href
                      ? "bg-primary bg-opacity-10 text-primary border-l-4 border-primary"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <link.icon className="mr-3 h-5 w-5" />
                  {link.name}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-4 py-2 mt-auto border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-medium">
            JS
          </div>
          <div>
            <p className="text-sm font-medium">John Smith</p>
            <p className="text-xs text-gray-500">DevOps Engineer</p>
          </div>
        </div>
        <ul>
          <li className="mb-1">
            <a
              href="#"
              className="flex items-center px-2 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              <User className="mr-2 h-3.5 w-3.5" />
              Profile
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center px-2 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Logout
            </a>
          </li>
        </ul>
      </div>
    </aside>
  );
}

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  
  const links = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Security Monitoring",
      href: "/security",
      icon: ShieldAlert,
    },
    {
      name: "Cost Optimization",
      href: "/cost",
      icon: DollarSign,
    },
    {
      name: "Resource Utilization",
      href: "/resources",
      icon: BarChart4,
    },
    {
      name: "Alerts",
      href: "/alerts",
      icon: Bell,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="md:hidden text-gray-700 focus:outline-none p-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-md z-30 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold font-inter text-primary">CloudGuard</h1>
          </div>
          <button onClick={closeSidebar} className="text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <nav className="py-4">
          <ul>
            {links.map((link) => (
              <li key={link.href} className="mb-1">
                <Link href={link.href}>
                  <div
                    className={cn(
                      "flex items-center px-4 py-3 text-sm font-medium rounded-r-lg cursor-pointer",
                      location === link.href
                        ? "bg-primary bg-opacity-10 text-primary border-l-4 border-primary"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    onClick={closeSidebar}
                  >
                    <link.icon className="mr-3 h-5 w-5" />
                    {link.name}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="px-4 py-2 mt-auto border-t border-gray-200 absolute bottom-0 w-full">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-medium">
              JS
            </div>
            <div>
              <p className="text-sm font-medium">John Smith</p>
              <p className="text-xs text-gray-500">DevOps Engineer</p>
            </div>
          </div>
          <ul>
            <li className="mb-1">
              <a
                href="#"
                className="flex items-center px-2 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
              >
                <User className="mr-2 h-3.5 w-3.5" />
                Profile
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center px-2 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Logout
              </a>
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}
