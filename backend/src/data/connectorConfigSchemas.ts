export interface ConnectorConfigField {
  key: string;
  label: string;
  placeholder: string;
  secret: boolean;
  required: boolean;
}

// What each connector actually needs to authenticate against the real system —
// today these values are only stored (masked) server-side and never dialed out to;
// they exist so a customer's IT admin has somewhere to put real credentials once a
// connector's sync() is swapped for a real API client (see ARCHITECTURE.md).
export const connectorConfigSchemas: Record<string, ConnectorConfigField[]> = {
  "sys-hris": [
    { key: "tenantUrl", label: "Workday Tenant URL", placeholder: "https://wd5.myworkday.com/yourtenant", secret: false, required: true },
    { key: "clientId", label: "API Client ID", placeholder: "wd-client-id", secret: false, required: true },
    { key: "clientSecret", label: "API Client Secret", placeholder: "••••••••", secret: true, required: true }
  ],
  "sys-ats": [
    { key: "apiKey", label: "Harvest API Key", placeholder: "gh_harvest_...", secret: true, required: true },
    { key: "onBehalfOfUser", label: "On-Behalf-Of User ID", placeholder: "1234567 (optional)", secret: false, required: false }
  ],
  "sys-pm": [
    { key: "baseUrl", label: "Atlassian Site URL", placeholder: "https://yourcompany.atlassian.net", secret: false, required: true },
    { key: "email", label: "Account Email", placeholder: "integrations@yourcompany.com", secret: false, required: true },
    { key: "apiToken", label: "API Token", placeholder: "••••••••", secret: true, required: true }
  ],
  "sys-perf": [
    { key: "apiKey", label: "Lattice API Key", placeholder: "lattice_...", secret: true, required: true }
  ],
  "sys-lms": [
    { key: "baseUrl", label: "Cornerstone Portal URL", placeholder: "https://yourcompany.csod.com", secret: false, required: true },
    { key: "clientId", label: "Client ID", placeholder: "cornerstone-client-id", secret: false, required: true },
    { key: "clientSecret", label: "Client Secret", placeholder: "••••••••", secret: true, required: true }
  ],
  "sys-skills": [
    { key: "endpointUrl", label: "Taxonomy Service Endpoint", placeholder: "https://internal.yourcompany.com/skills-api", secret: false, required: true },
    { key: "apiKey", label: "API Key", placeholder: "••••••••", secret: true, required: false }
  ]
};
