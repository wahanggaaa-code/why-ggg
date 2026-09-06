export type Stat = {
  value: number | null;
  suffix: string;
  display?: string;
  label: string;
};

export type Project = {
  id: string;
  title: string;
  tag: string;
  year: string;
  gradient: string;
};

export const site = {
  handle: "why-ggg",
  name: "Wahang",
  role: "Creative Frontend Developer",
  location: "Jakarta, ID",
  email: "halo@whyggg.dev",
  year: "2026",
  videoUrl:
    "https://github.com/wahanggaaa-code/why-ggg/releases/download/Asset01/Geometric_crystal_forming_animation_1080p_202609061649.2.mp4",
  /** Satu putaran video preloader diputar selama N detik (fast-forward). */
  loaderDurationSeconds: 3,

  marquee: [
    "Open for work",
    "Creative Development",
    "Motion Design",
    "UI Engineering",
    "Interaction",
    "Web Experience",
  ],

  hero: {
    label: "( Creative Frontend Developer )",
    lines: ["Mengubah kode", "menjadi pengalaman", "yang terasa hidup."],
    scrollHint: "( Scroll untuk menjelajah )",
  },

  about: {
    label: "( Tentang )",
    index: "01 / 05",
    lines: [
      "Aku Wahang — creative frontend developer dari Jakarta.",
      "Fokusku mengubah ide mentah menjadi pengalaman web yang",
      "halus, responsif, dan punya karakter.",
      "Motion bukan hiasan; ia adalah cara halaman berbicara.",
    ],
    stats: [
      { value: 3, suffix: "+", label: "Tahun ngoding" },
      { value: 24, suffix: "", label: "Proyek selesai" },
      { value: null, suffix: "", display: "∞", label: "Cangkir kopi" },
    ] as Stat[],
  },

  manifesto: {
    label: "( Filosofi )",
    lines: [
      "Halaman yang baik tidak hanya",
      "terlihat indah — ia bergerak,",
      "bernapas, dan bercerita.",
    ],
  },

  work: {
    label: "( Karya pilihan )",
    count: "04 proyek",
    projects: [
      {
        id: "01",
        title: "Nebula Commerce",
        tag: "Web Experience",
        year: "2026",
        gradient: "from-[#241a45] via-[#4630a8] to-[#8b5cf6]",
      },
      {
        id: "02",
        title: "Kopi Tanah",
        tag: "Brand Site",
        year: "2025",
        gradient: "from-[#43251a] via-[#a8542f] to-[#e8a04a]",
      },
      {
        id: "03",
        title: "Pulse Dashboard",
        tag: "Product UI",
        year: "2025",
        gradient: "from-[#0e3535] via-[#156b6b] to-[#38c4b8]",
      },
      {
        id: "04",
        title: "Arsip Studio",
        tag: "Portfolio",
        year: "2024",
        gradient: "from-[#222226] via-[#3a3a42] to-[#6f6f7a]",
      },
    ] as Project[],
  },

  skills: {
    label: "( Keahlian )",
    items: [
      { id: "01", title: "Creative Development", note: "React · TypeScript · Motion" },
      { id: "02", title: "Motion & Interaction", note: "Micro-interactions · Transisi halaman" },
      { id: "03", title: "UI Engineering", note: "Design system · Tailwind · Aksesibilitas" },
      { id: "04", title: "Performance", note: "Core Web Vitals · Optimasi aset" },
    ],
  },

  journey: {
    label: "( Perjalanan )",
    items: [
      {
        year: "2024",
        title: "Mulai ngoding serius",
        note: "Freelance — proyek pertama, belajar jatuh bangun di production.",
      },
      {
        year: "2025",
        title: "Frontend Developer",
        note: "Studio digital di Jakarta — motion, design system, kolaborasi lintas tim.",
      },
      {
        year: "2026",
        title: "Why-ggg",
        note: "Fokus ke karya personal, eksperimen motion, dan site seperti ini.",
      },
    ],
  },

  contact: {
    label: "( Mari bikin sesuatu )",
    cta: "Say hello",
    note: "Punya ide? Cerita dulu — nanti kita wujudkan jadi pengalaman yang terasa hidup.",
  },

  footer: {
    madeWith: "Dibuat dengan motion & kopi",
  },

  socials: [
    { label: "GitHub", href: "https://github.com/wahanggaaa-code" },
    { label: "LinkedIn", href: "https://www.linkedin.com/" },
    { label: "Instagram", href: "https://www.instagram.com/" },
  ],
};

export type Site = typeof site;
