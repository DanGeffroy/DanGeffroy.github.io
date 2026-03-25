export interface Template {
  link: string;
  title: string;
  desc: string;
  location: string;
  date: string;
  current?: boolean;
}

export const details: Template[] = [
  {
    link: "https://github.com/dangeffroy",
    title: "Side projects",
    desc: "I use side projects to keep up with technology constantly evolving. Right now I use Astro and Svelte to build this website",
    location: "Nantes, France",
    date: "∞",
  },
  {
    link: "https://www.malakoffhumanis.com",
    title: "Lead dev for Malakoff Humanis insurance",
    desc: "Developing client website and apps, mostly in Angular / Springboot",
    location: "Nantes, France",
    date: "Jul. 2023 → Present",
    current: true,
  },
  {
    link: "https://www.credit-agricole.fr/",
    title: "Lead dev for credit agricole insurance",
    desc: "Developing client website and apps, mostly in Angular",
    location: "Nantes, France",
    date: "01.01.2021",
  },
  {
    link: "https://www.groupama.fr",
    title: "Working for Groupama insurance",
    desc: "Developing microservices, mostly in JAVA",
    location: "Nantes, France",
    date: "01.08.2018",
  },
  {
    link: "https://www.hsbc.fr",
    title: "Working for HSBC Holdings",
    desc: "Developing migration batch file, mostly in SQL",
    location: "Nantes, France",
    date: "01.08.2016",
  },
];

export const totalExp: number =
  new Date(Date.now() - new Date("2016/08/01").getTime()).getFullYear() - 1970;
