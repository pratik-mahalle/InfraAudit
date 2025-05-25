import { KubernetesIntegration } from "@/components/kubernetes/KubernetesIntegration";
import { MainLayout } from "@/layouts/MainLayout";

export default function KubernetesPage() {
  return (
    <MainLayout>
      <div className="container max-w-7xl mx-auto py-8">
        <KubernetesIntegration />
      </div>
    </MainLayout>
  );
}