export const stageNames: Record<string, string[]> = {
  "full-stack": [
    "Frontend Foundations",
    "Backend Build",
    "API Integration",
    "Full-Stack Launch",
    "Bootcamp"
  ],
  "product-design": [
    "User Research",
    "Wireframing & UI",
    "Prototyping & Testing",
    "Portfolio Presentation",
    "Bootcamp"
  ],
  "data-analysis": [
    "Data Collection & Cleaning",
    "Exploratory Analysis",
    "Visualization & Insights",
    "Capstone Report",
    "Bootcamp"
  ],
  "cyber-security": [
    "Network Fundamentals",
    "Threat & Vulnerability",
    "Penetration Testing",
    "Security Audit & Defense",
    "Bootcamp"
  ],
};

export type Program = keyof typeof stageNames;

export function getStageTitle(program: Program, order: number): string {
  const titles = stageNames[program];
  if (!titles || order < 1 || order > titles.length) {
    return `Stage ${order}`;
  }
  return titles[order - 1];
}
