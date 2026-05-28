import { KubernetesIntegration } from "@/components/kubernetes/KubernetesIntegration";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export default function KubernetesPage() {
  return (
    <DashboardLayout>
      <div className="container max-w-7xl mx-auto py-8">
        <KubernetesIntegration />
      </div>
    </DashboardLayout>
  );
}