import { CloudProviderSetup } from "@/components/providers/CloudProviderSetup";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export default function CloudProviders() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <CloudProviderSetup />
      </div>
    </DashboardLayout>
  );
}