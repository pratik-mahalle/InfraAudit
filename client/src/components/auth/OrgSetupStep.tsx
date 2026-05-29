import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building2, Users } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

interface InviteDetails {
  org_name: string;
  role: string;
  email: string;
}

interface Props {
  accessToken: string;
  inviteToken?: string;
  onComplete: () => void;
}

export function OrgSetupStep({ accessToken, inviteToken, onComplete }: Props) {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>(
    inviteToken ? 'join' : 'choose'
  );
  const [orgName, setOrgName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);

  useEffect(() => {
    if (inviteToken && mode === 'join') {
      fetch(`${API_BASE}/api/invite/${inviteToken}`)
        .then(r => r.json())
        .then(json => {
          if (json.data) setInviteDetails(json.data);
          else setError('Invalid or expired invite link');
        })
        .catch(() => setError('Failed to load invite details'));
    }
  }, [inviteToken, mode]);

  const handleCreate = async () => {
    if (!orgName.trim()) { setError('Organization name is required'); return; }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: orgName }),
      });
      if (!res.ok) throw new Error('Failed to create organization');
      onComplete();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/invite/${inviteToken}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Failed to accept invite');
      onComplete();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === 'join' && inviteToken) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Join Organization</h2>
        {!inviteDetails && !error && <Loader2 className="h-5 w-5 animate-spin mx-auto text-blue-600" />}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {inviteDetails && (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You've been invited to join <strong>{inviteDetails.org_name}</strong> as <strong>{inviteDetails.role}</strong>.
            </p>
            <Button className="w-full" onClick={handleJoin} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
              Accept & Join
            </Button>
            <Button variant="ghost" className="w-full text-gray-500" onClick={onComplete}>
              Skip for now
            </Button>
          </>
        )}
        {error && (
          <Button variant="outline" className="w-full" onClick={onComplete}>
            Continue without joining
          </Button>
        )}
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Organization</h2>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div>
          <Label htmlFor="orgName">Organization Name</Label>
          <Input
            id="orgName"
            placeholder="Acme Corp"
            value={orgName}
            onChange={e => { setOrgName(e.target.value); setError(''); }}
            className="mt-1"
          />
        </div>
        <Button className="w-full" onClick={handleCreate} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Organization
        </Button>
        <Button variant="ghost" className="w-full text-gray-500" onClick={() => setMode('choose')}>
          ← Back
        </Button>
      </div>
    );
  }

  // mode === 'choose'
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Set up your organization</h2>
      <p className="text-sm text-gray-500">You can always do this later from Settings.</p>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button className="w-full" onClick={() => setMode('create')}>
        <Building2 className="mr-2 h-4 w-4" /> Create Organization
      </Button>
      <Button variant="outline" className="w-full text-gray-500" onClick={onComplete}>
        Skip for now
      </Button>
    </div>
  );
}
