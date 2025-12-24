import React from "react";

export default function APIPage() {
  return (
    <div className="container mx-auto px-4 py-8 prose prose-slate dark:prose-invert">
      <h1>InfraAudit API</h1>
      <p>Use the API to programmatically access cost, security, and resource data.</p>
      <h2>Authentication</h2>
      <p>
        Send a Bearer token in the Authorization header. Contact support to obtain
        an API key during private beta.
      </p>
      <h2>Endpoints</h2>
      <ul>
        <li><code>GET /api/costs/summary</code> - Cost overview by provider and service.</li>
        <li><code>GET /api/security/findings</code> - Latest security findings.</li>
        <li><code>GET /api/resources/utilization</code> - Utilization metrics.</li>
      </ul>
      <h2>Errors</h2>
      <p>Errors follow RFC 7807 problem+json with <code>status</code> and <code>detail</code>.</p>
    </div>
  );
}


