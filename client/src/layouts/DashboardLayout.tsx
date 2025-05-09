import React, { ReactNode, useState } from "react";
import { Sidebar, MobileSidebar } from "@/components/ui/sidebar";
import { Bell, Settings, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast({
        title: "Search",
        description: `Searching for "${searchQuery}"`,
      });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background pb-10">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center md:hidden">
              <MobileSidebar />
            </div>
            <div className="flex-1 flex items-center md:px-4">
              <form onSubmit={handleSearch} className="relative max-w-md w-full">
                <input
                  type="text"
                  placeholder="Search resources, alerts, or configs..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute left-3 top-2.5 text-gray-500">
                  <Search className="h-4 w-4" />
                </div>
              </form>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-gray-700 focus:outline-none relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-danger"></span>
              </button>
              <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
                <Settings className="h-5 w-5" />
              </button>
              <button className="flex items-center text-gray-500 hover:text-gray-700 focus:outline-none md:hidden">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                  JS
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
