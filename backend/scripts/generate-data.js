// Deterministic seed-data generator for the internal talent marketplace demo.
// Run with: npm run generate-data (from backend/). Output: src/data/employees.json
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- seeded RNG so the dataset is reproducible ---
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20240614);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const pickN = (arr, n) => {
  const pool = [...arr];
  const out = [];
  for (let i = 0; i < n && pool.length; i++) {
    const idx = Math.floor(rand() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
};
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const chance = (p) => rand() < p;

const NOW = new Date("2026-09-26T00:00:00.000Z");
function monthsAgoISO(n) {
  const d = new Date(NOW);
  d.setUTCMonth(d.getUTCMonth() - n);
  return d.toISOString();
}
// Certification/manager sign-off and fresh project delivery get re-verified sooner than
// a skill nobody but the employee has ever claimed -- this seeds the confidence-decay model.
function verifiedDateForSources(sourcePool) {
  if (sourcePool.includes("certification") || sourcePool.includes("manager")) return monthsAgoISO(randInt(0, 10));
  if (sourcePool.includes("project") || sourcePool.includes("lms")) return monthsAgoISO(randInt(2, 20));
  return monthsAgoISO(randInt(12, 42));
}

const firstNames = [
  "Aarav", "Isha", "Rohan", "Diya", "Kabir", "Ananya", "Vivaan", "Myra", "Arjun", "Saanvi",
  "Reyansh", "Aadhya", "Vihaan", "Kiara", "Ayaan", "Zara", "Advik", "Ira", "Krishna", "Riya",
  "Dev", "Naina", "Sai", "Meera", "Aryan", "Tara", "Yash", "Simran", "Rahul", "Neha",
  "Karan", "Pooja", "Nikhil", "Ritika", "Varun", "Anjali", "Siddharth", "Kavya", "Manav", "Ishita",
  "Aditya", "Sneha", "Raghav", "Priya", "Dhruv", "Nisha", "Uday", "Aisha", "Kunal", "Divya"
];
const lastNames = [
  "Sharma", "Verma", "Iyer", "Nair", "Gupta", "Menon", "Rao", "Kapoor", "Malhotra", "Chopra",
  "Reddy", "Pillai", "Bose", "Mehta", "Joshi", "Shah", "Agarwal", "Bansal", "Chatterjee", "Desai",
  "Ghosh", "Kulkarni", "Mishra", "Naidu", "Patel", "Pandey", "Rastogi", "Saxena", "Trivedi", "Yadav"
];

const avatarPalette = ["#2563EB", "#7C3AED", "#0891B2", "#DB2777", "#EA580C", "#059669", "#4F46E5", "#B45309"];

const titlesByDept = {
  Product: ["Associate Product Manager", "Product Analyst", "Program Manager"],
  Engineering: ["Software Engineer I", "Software Engineer II", "Senior Software Engineer", "QA Engineer", "UI Developer"],
  Data: ["Data Analyst", "Data Engineer", "Junior Data Scientist", "Analytics Associate"],
  Design: ["Graphic Designer", "Product Designer", "UI/UX Associate"],
  Business: ["Business Analyst", "Operations Analyst", "Strategy Associate"],
  Security: ["IT Support Specialist", "Systems Administrator", "Network Engineer"],
  Marketing: ["Marketing Analyst", "Growth Associate", "Content Strategist"],
  Sales: ["Sales Operations Analyst", "Customer Success Manager", "Account Manager"],
  HR: ["HR Analyst", "Talent Coordinator", "People Ops Associate"],
  Finance: ["Financial Analyst", "Finance Associate", "Budget Analyst"]
};
const departments = Object.keys(titlesByDept);
const locations = ["Bengaluru", "Mumbai", "Pune", "Hyderabad", "Gurugram", "Chennai", "Remote"];

const masterSkills = [
  "Requirement Gathering", "Product Roadmapping", "Stakeholder Management", "User Research", "Backlog Prioritization", "Go-To-Market Strategy",
  "Python", "Machine Learning", "Deep Learning", "MLOps", "Model Deployment", "Data Engineering", "Statistical Analysis", "SQL", "Data Visualization", "Prompt Engineering",
  "Cloud Architecture (AWS)", "Cloud Architecture (Azure)", "Kubernetes", "CI/CD", "Infrastructure as Code", "Monitoring & Observability", "Site Reliability Engineering",
  "UX Research", "Wireframing", "Interaction Design", "Usability Testing", "Design Systems",
  "Java", "API Development", "System Design", "Database Design", "Microservices", "Frontend Development",
  "Business Analysis", "Agile Facilitation",
  "Threat Modeling", "Penetration Testing", "Security Compliance", "Incident Response", "Network Security"
];

// Mirrors a subset of backend/src/data/skillsRepository.json's alias lists, so seeded
// data occasionally arrives the way a real connector would report it.
const skillAliasSample = {
  "Machine Learning": "ML",
  "Deep Learning": "DL",
  "Cloud Architecture (AWS)": "AWS",
  "Kubernetes": "K8s",
  "Business Analysis": "BA"
};

const certPool = [
  { name: "PMP Certification", issuer: "PMI", skill: "Product Roadmapping" },
  { name: "Certified ScrumMaster", issuer: "Scrum Alliance", skill: "Agile Facilitation" },
  { name: "AWS Certified Solutions Architect", issuer: "AWS", skill: "Cloud Architecture (AWS)" },
  { name: "TensorFlow Developer Certificate", issuer: "Google", skill: "Deep Learning" },
  { name: "Certified Kubernetes Administrator", issuer: "CNCF", skill: "Kubernetes" },
  { name: "CISSP", issuer: "ISC2", skill: "Security Compliance" },
  { name: "Google UX Design Certificate", issuer: "Google", skill: "UX Research" },
  { name: "Microsoft Azure Fundamentals", issuer: "Microsoft", skill: "Cloud Architecture (Azure)" },
  { name: "Certified Business Analysis Professional", issuer: "IIBA", skill: "Business Analysis" },
  { name: "Certified Ethical Hacker", issuer: "EC-Council", skill: "Penetration Testing" }
];

// Evidence phrase banks: unstructured text that a keyword-only search on job title/skills tag would miss.
const evidenceBanks = {
  pm: [
    "led requirement gathering sessions with cross-functional stakeholders",
    "created the product roadmap for the next three quarters",
    "managed stakeholders across engineering, design, and sales",
    "prioritized the backlog based on customer impact and effort",
    "conducted user research and customer interviews to validate the concept",
    "defined the go-to-market strategy for the new feature launch",
    "wrote the product requirements document (PRD) for the initiative"
  ],
  ai: [
    "built a machine learning pipeline to detect anomalies in transaction data",
    "trained and deployed a deep learning model to production",
    "fine-tuned a large language model for internal search",
    "implemented computer vision models for defect detection",
    "designed an MLOps pipeline for continuous model retraining",
    "applied prompt engineering techniques to improve LLM response accuracy",
    "built a recommendation engine using collaborative filtering"
  ],
  ds: [
    "performed statistical analysis and hypothesis testing on experiment data",
    "built an interactive dashboard to visualize key business metrics",
    "ran A/B tests to measure feature impact on conversion",
    "wrote complex SQL queries to extract insights from the data warehouse",
    "presented data-driven insights to senior leadership"
  ],
  devops: [
    "built the CI/CD pipeline that cut deployment time by 60%",
    "migrated infrastructure to Kubernetes for better scalability",
    "wrote Terraform modules to manage infrastructure as code",
    "led the on-call rotation and improved incident response times",
    "set up monitoring and alerting across the production environment"
  ],
  ux: [
    "conducted usability testing sessions with target users",
    "created wireframes and interactive prototypes in Figma",
    "redesigned the onboarding flow, improving activation by 20%",
    "built and maintained the company's design system",
    "ran user interviews to uncover pain points in the checkout flow"
  ],
  backend: [
    "designed the system architecture for a high-traffic service",
    "built RESTful APIs consumed by multiple client applications",
    "broke the monolith apart into a microservices architecture",
    "optimized the database schema, reducing query latency by 40%"
  ],
  ba: [
    "gathered business requirements from stakeholders across departments",
    "performed gap analysis to identify process inefficiencies",
    "built reporting dashboards used by the leadership team",
    "documented business processes and recommended improvements"
  ],
  security: [
    "conducted a penetration test on the customer-facing application",
    "performed threat modeling for the new payment system",
    "led incident response for a critical security event",
    "completed a security compliance review against SOC 2 requirements"
  ]
};
const evidenceCategories = Object.keys(evidenceBanks);

const skillsForCategory = {
  pm: ["Requirement Gathering", "Product Roadmapping", "Stakeholder Management", "User Research", "Backlog Prioritization", "Go-To-Market Strategy"],
  ai: ["Python", "Machine Learning", "Deep Learning", "MLOps", "Model Deployment", "Prompt Engineering"],
  ds: ["Python", "Statistical Analysis", "SQL", "Data Visualization", "Machine Learning"],
  devops: ["Cloud Architecture (AWS)", "Kubernetes", "CI/CD", "Infrastructure as Code", "Monitoring & Observability"],
  ux: ["UX Research", "Wireframing", "Interaction Design", "Usability Testing", "Design Systems"],
  backend: ["Java", "API Development", "System Design", "Database Design", "Microservices"],
  ba: ["Business Analysis", "Requirement Gathering", "SQL", "Data Visualization"],
  security: ["Threat Modeling", "Penetration Testing", "Security Compliance", "Incident Response", "Network Security"]
};

const lmsCatalog = JSON.parse(
  await import("node:fs").then((fs) => fs.readFileSync(join(__dirname, "..", "src", "data", "lmsCatalog.json"), "utf-8"))
);

const feedbackTemplates = [
  "Consistently {phrase}. A dependable teammate who raises the bar for the group.",
  "This cycle, {name} {phrase}, which had a visible impact on the team's roadmap.",
  "{name} has grown a lot this year and {phrase} with minimal guidance.",
  "Strong performer -- {phrase} and mentors juniors on the team.",
  "Solid, steady contributor. {phrase_cap} was a highlight of the review period."
];

const employees = [];
const totalEmployees = 95;

for (let i = 0; i < totalEmployees; i++) {
  const id = `emp-${String(i + 1).padStart(3, "0")}`;
  const first = pick(firstNames);
  const last = pick(lastNames);
  const name = `${first} ${last}`;
  const department = pick(departments);
  const title = pick(titlesByDept[department]);
  const tenureYears = randInt(1, 13);
  const location = pick(locations);
  const avatarColor = pick(avatarPalette);
  const mobilityRoll = rand();
  const mobility = mobilityRoll < 0.3 ? "high" : mobilityRoll < 0.75 ? "medium" : "low";
  const interestedInReskilling = chance(0.65);

  // Each employee carries 1-3 "hidden capability" categories -- may or may not match their formal title.
  const numCategories = randInt(1, 3);
  const categories = pickN(evidenceCategories, numCategories);

  // Build skills: base skills from their categories + a few random generic ones.
  const skillNames = new Set();
  categories.forEach((cat) => skillsForCategory[cat].forEach((s) => { if (chance(0.75)) skillNames.add(s); }));
  while (skillNames.size < randInt(5, 8)) skillNames.add(pick(masterSkills));

  const skills = [...skillNames].map((rawSkillName) => {
    // Occasionally record the alias a real connector would surface (e.g. an ATS resume
    // parse tagging "ML" or "AWS") instead of the canonical name, so the skills
    // repository's alias-resolution has something real to prove out.
    const alias = skillAliasSample[rawSkillName];
    const skillName = alias && chance(0.35) ? alias : rawSkillName;
    const isPrimary = categories.some((cat) => skillsForCategory[cat].includes(rawSkillName));
    const level = isPrimary ? randInt(3, 5) : randInt(1, 3);
    const sourcePool = ["self"];
    if (chance(0.5)) sourcePool.push("project");
    if (chance(0.3)) sourcePool.push("manager");
    if (chance(0.2)) sourcePool.push("lms");
    return { name: skillName, level, source: sourcePool, lastVerifiedAt: verifiedDateForSources(sourcePool) };
  });

  // Certifications
  const numCerts = randInt(0, 3);
  const certifications = pickN(certPool, numCerts).map((c) => ({
    name: c.name,
    issuer: c.issuer,
    year: randInt(2018, 2025)
  }));
  certifications.forEach((c) => {
    const certDef = certPool.find((p) => p.name === c.name);
    if (certDef && !skills.find((s) => s.name === certDef.skill)) {
      const certifiedAt = new Date(Date.UTC(c.year, randInt(0, 11), randInt(1, 28))).toISOString();
      skills.push({ name: certDef.skill, level: randInt(3, 5), source: ["certification"], lastVerifiedAt: certifiedAt });
    }
  });

  // Projects with embedded evidence phrases (the "unstructured" data an evidence engine reads).
  const numProjects = randInt(1, 3);
  const projectNames = ["Project Nova", "Project Atlas", "Project Horizon", "Project Vertex", "Project Meridian", "Project Orion", "Project Catalyst", "Project Zenith"];
  const projects = [];
  for (let p = 0; p < numProjects; p++) {
    const cat = pick(categories);
    const phrase = pick(evidenceBanks[cat]);
    const secondaryPhrase = chance(0.4) ? pick(evidenceBanks[pick(categories)]) : null;
    projects.push({
      name: pick(projectNames) + ` ${randInt(1, 9)}`,
      role: title,
      description: `As part of the team, ${first} ${phrase}${secondaryPhrase ? `, and also ${secondaryPhrase}` : ""}.`,
      year: randInt(2020, 2025)
    });
  }

  // Past roles
  const numPastRoles = randInt(0, 2);
  const pastRoles = [];
  let endYear = 2025 - tenureYears;
  for (let r = 0; r < numPastRoles; r++) {
    const startYear = endYear - randInt(1, 3);
    pastRoles.push({
      title: pick(titlesByDept[pick(departments)]),
      team: pick(departments),
      startYear,
      endYear
    });
    endYear = startYear;
  }

  // Manager feedback with occasional evidence phrases
  const numFeedback = randInt(1, 2);
  const managerFeedback = [];
  for (let f = 0; f < numFeedback; f++) {
    const cat = pick(categories);
    const phrase = pick(evidenceBanks[cat]);
    const template = pick(feedbackTemplates);
    const comments = template
      .replaceAll("{phrase_cap}", phrase.charAt(0).toUpperCase() + phrase.slice(1))
      .replaceAll("{phrase}", phrase)
      .replaceAll("{name}", first);
    managerFeedback.push({
      cycle: pick(["H1 2024", "H2 2024", "H1 2025", "Annual 2024"]),
      rating: pick(["Exceeds Expectations", "Meets Expectations", "Strong Performer", "Outstanding"]),
      comments
    });
  }

  // LMS completions
  const numLms = randInt(0, 4);
  const lmsCompletions = pickN(lmsCatalog, numLms).map((course) => ({
    course: course.title,
    completedDate: `${randInt(2022, 2025)}-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`,
    hours: course.hours
  }));

  // Resume summary
  const summaryPhrase = pick(evidenceBanks[pick(categories)]);
  const resumeSummary = `${title} with ${tenureYears} years of experience in ${department}. Recently ${summaryPhrase}. Known for collaborating well across teams and delivering on commitments.`;

  employees.push({
    id,
    name,
    title,
    department,
    location,
    tenureYears,
    avatarColor,
    skills,
    certifications,
    projects,
    pastRoles,
    managerFeedback,
    lmsCompletions,
    resumeSummary,
    interestedInReskilling,
    mobility
  });
}

writeFileSync(join(__dirname, "..", "src", "data", "employees.json"), JSON.stringify(employees, null, 2));
console.log(`Generated ${employees.length} employees -> src/data/employees.json`);
