import { storageUrl } from "@/lib/storage";

const aiko = storageUrl("characters", "aiko.png");
const emma = storageUrl("characters", "emma.png");
const gina = storageUrl("characters", "gina.png");
const sidd = storageUrl("characters", "sidd.png");

export type CharacterId = "aiko" | "emma" | "gina" | "sidd";

export type Character = {
  id: CharacterId;
  name: string;
  place: string; // "garden", "classroom", "playground", "room"
  tagline: string;
  story: string;
  img: string;
  bg: string; // tailwind gradient
  accent: string; // tailwind bg-* for pills/buttons
  frame: string; // tailwind bg-* for card frame
  props: string[]; // emoji props
};

export const CHARACTERS: Record<CharacterId, Character> = {
  emma: {
    id: "emma",
    name: "Emma",
    place: "classroom",
    tagline: "Space explorer 🚀",
    story:
      "I am passionate about space exploration and love to learn about stars, planets, and the mysteries of the universe. I'm excited to use this app to improve my language skills so I can communicate with astronauts and scientists from all over the world.",
    img: emma,
    bg: "from-[#6C4DE0] via-[#7B5CE8] to-[#4A2FB8]",
    accent: "bg-teal",
    frame: "bg-teal",
    props: ["⭐", "🪐", "🔭", "🌟", "🚀"],
  },
  sidd: {
    id: "sidd",
    name: "Sidd",
    place: "playground",
    tagline: "Safari adventurer 🦁",
    story:
      "I am an animal lover who dreams of going on a safari one day. I'm excited to use the English learning app to learn new words and phrases so I can communicate with the locals and learn more about the animals I love — especially the lion!",
    img: sidd,
    bg: "from-[#4FBF8A] via-[#6DD3A2] to-[#38A374]",
    accent: "bg-[#7B4A24]",
    frame: "bg-[#7B4A24]",
    props: ["🌿", "🦁", "🐘", "🌴", "🍃"],
  },
  aiko: {
    id: "aiko",
    name: "Aiko",
    place: "garden",
    tagline: "Plant lover 🌱",
    story:
      "I am very passionate about plants. I'm fascinated by the beauty and diversity of botanical gardens. I want to improve my language skills so I can talk with botanists from all over the world and become an advocate for the environment.",
    img: aiko,
    bg: "from-[#B7E27A] via-[#D6EE9A] to-[#8FCB5A]",
    accent: "bg-leaf",
    frame: "bg-leaf",
    props: ["🌸", "🌱", "🍀", "🌼", "🦋"],
  },
  gina: {
    id: "gina",
    name: "Gina",
    place: "room",
    tagline: "World traveler ✈️",
    story:
      "I am a world traveler who has visited many countries and loves to learn about different cultures. I'm excited to improve my language skills so I can communicate with people from all over the world on my travel adventure!",
    img: gina,
    bg: "from-[#F0A5C5] via-[#F6C1D9] to-[#E88AB1]",
    accent: "bg-berry",
    frame: "bg-berry",
    props: ["🗺️", "✈️", "🎒", "🗽", "🌏"],
  },
};

export const CHARACTER_LIST: Character[] = [
  CHARACTERS.emma,
  CHARACTERS.sidd,
  CHARACTERS.aiko,
  CHARACTERS.gina,
];

const STORAGE_KEY = "shine:character";

export function saveCharacter(id: CharacterId) {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {}
  }
}

export function loadCharacter(): CharacterId | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v && v in CHARACTERS) return v as CharacterId;
  } catch {}
  return null;
}
