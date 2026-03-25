export interface Project {
  title: string;
  description: string;
  url?: string;
  fakeUrl: string;
  tags: string[];
  color: string;
  image?: string;
  isInternal?: boolean;
}

export const projects: Project[] = [
    {
    title: "Digital Academy",
    description:
      "Internal documentation and training portal — a single hub for onboarding guides, tech references, and learning paths across the organisation.",
    fakeUrl: "digital-academy.internal",
    tags: ["Astro"],
    color: "#38BDF8",
    image: "/screenshots/digital_academy.png",
    isInternal: true,
  },
  {
    title: "Accessmh",
    description:
      "Brokerage extranet for Malakoff Humanis — real-time quotes that adapt to each client's obligations, with customisable commissions to boost conversion.",
    url: "https://accessmh.malakoffhumanis.com/",
    fakeUrl: "accessmh.malakoffhumanis.com",
    tags: ["Angular", "Spring Boot"],
    image: "/screenshots/accessmh.png",
    color: "#6366F1",
  },

  {
    title: "Portfolio v2",
    description:
      "This very portfolio — built with Astro, Svelte, and a neobrutalist design system.",
    url: "https://dangeffroy.github.io",
    fakeUrl: "dangeffroy.github.io",
    tags: ["Astro", "Tailwind", "TypeScript"],
    color: "#FF6B9D",
    image: "/screenshots/portfolio.png",
  },
  {
    title: "Deadlock Timer",
    description:
      "A in-game utility timer for Deadlock, helping players track cooldowns and key game events.",
    url: "https://dangeffroy.github.io/deadlock-timer/",
    fakeUrl: "dangeffroy.github.io/deadlock-timer",
    tags: ["TypeScript", "Gaming", "Utility"],
    color: "#FF6B35",
    image: "/screenshots/deadlock-timer.png",
  },
  {
    title: "e-ADE",
    description:
      "Client portal for Crédit Agricole borrower insurance adhesion. Lets customers review their loan & coverage details and sign documents electronically.",
    url: "https://e-ade.credit-agricole.fr",
    fakeUrl: "e-ade.credit-agricole.fr",
    tags: ["Angular", "TypeScript", "Spring Boot"],
    image: "/screenshots/eade.png",
    color: "#4CAF82",
  },
  {
    title: "Blobby Cursor",
    description:
      "An interactive blob cursor experiment built with Svelte and SVG filters.",
    url: "https://dangeffroy.github.io/blobby",
    fakeUrl: "dangeffroy.github.io/blobby",
    tags: ["Svelte", "SVG", "Canvas"],
    color: "#C77DFF",
    image: "/screenshots/blobby.png",
  },

];
