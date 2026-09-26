import type { Employee } from "../types.js";

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function nowISO(): string {
  return new Date().toISOString();
}

// A small slice of the same evidence-phrase banks the seed generator uses, so a synced
// project or feedback entry reads like real delivery evidence rather than placeholder text.
export const evidencePhrasesByCategory: Record<string, string[]> = {
  pm: [
    "led requirement gathering sessions with cross-functional stakeholders",
    "created the product roadmap for the next quarter",
    "managed stakeholders across engineering, design, and sales"
  ],
  ai: [
    "built a machine learning pipeline for the new recommendation feature",
    "fine-tuned a model and deployed it to production",
    "designed an MLOps pipeline for continuous retraining"
  ],
  ds: [
    "performed statistical analysis on the latest experiment results",
    "built an interactive dashboard for the leadership review"
  ],
  devops: [
    "shipped a CI/CD pipeline improvement that cut deploy time",
    "migrated a service to Kubernetes for better scalability"
  ],
  ux: [
    "ran usability testing sessions with target users",
    "shipped new wireframes and prototypes for the redesign"
  ],
  backend: [
    "designed the system architecture for a new high-traffic service",
    "shipped a set of RESTful APIs for the mobile team"
  ],
  ba: [
    "gathered business requirements across departments",
    "built a reporting dashboard for the leadership team"
  ],
  security: [
    "completed a penetration test on the customer-facing app",
    "led incident response for a production security event"
  ]
};

export const certPool = [
  { name: "PMP Certification", issuer: "PMI", skill: "Product Roadmapping" },
  { name: "AWS Certified Solutions Architect", issuer: "AWS", skill: "Cloud Architecture (AWS)" },
  { name: "TensorFlow Developer Certificate", issuer: "Google", skill: "Deep Learning" },
  { name: "Certified Kubernetes Administrator", issuer: "CNCF", skill: "Kubernetes" },
  { name: "Google UX Design Certificate", issuer: "Google", skill: "UX Research" },
  { name: "Certified Business Analysis Professional", issuer: "IIBA", skill: "Business Analysis" }
];

export function upsertSkill(employee: Employee, name: string, opts: { bump?: number; addSource: string; minLevel?: number }) {
  const existing = employee.skills.find((s) => s.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    if (opts.bump) existing.level = Math.min(5, existing.level + opts.bump);
    if (opts.minLevel) existing.level = Math.max(existing.level, opts.minLevel);
    if (!existing.source.includes(opts.addSource)) existing.source.push(opts.addSource);
    existing.lastVerifiedAt = nowISO();
  } else {
    employee.skills.push({
      name,
      level: opts.minLevel ?? 3,
      source: [opts.addSource],
      lastVerifiedAt: nowISO()
    });
  }
}
