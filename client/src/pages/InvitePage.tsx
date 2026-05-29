import { useEffect, useState } from "react";
import { useParams, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2, Building2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user, session, isLoading: authLoading } = useAuth();
  const [details, setDetails] = useState<{ org_name: string; role: string } | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/invite/${token}`)
      .then(r => r.json())
      .then(json => {
        if (json.data) setDetails(json.data);
        else setError(json.message || 'Invalid or expired invite link');
      })
      .catch(() => setError('Failed to load invite'))
      .finally(() => setIsLoading(false));
  }, [token]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }
  if (!user && !session) {
    return <Redirect to={`/signup?invite=${token}`} />;
  }

  if (accepted) {
    return <Redirect to="/dashboard" />;
  }

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const res = await fetch(`${API_BASE}/api/invite/${token}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Failed to accept invite');
      setAccepted(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-xl shadow-md p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Organization Invite</h1>
        </div>
        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : details ? (
          <>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              You've been invited to join <strong>{details.org_name}</strong> as <strong>{details.role}</strong>.
            </p>
            <Button className="w-full" onClick={handleAccept} disabled={accepting}>
              {accepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Accept Invite & Join
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
