import {
  BriefcaseBusiness,
  Camera,
  ChartNoAxesCombined,
  Code2,
  Languages,
  Mic2,
  Palette,
  PenLine,
  Play,
  Sparkles,
} from "lucide-react";

export const categories = [
  { name: "Design", count: 128, icon: Palette, tone: "violet" },
  { name: "Programação", count: 94, icon: Code2, tone: "blue" },
  { name: "Marketing", count: 86, icon: ChartNoAxesCombined, tone: "orange" },
  { name: "Redação", count: 73, icon: PenLine, tone: "pink" },
  { name: "Vídeo", count: 61, icon: Play, tone: "red" },
  { name: "Fotografia", count: 48, icon: Camera, tone: "cyan" },
  { name: "Consultoria", count: 52, icon: BriefcaseBusiness, tone: "green" },
  { name: "Tradução", count: 44, icon: Languages, tone: "indigo" },
  { name: "Áudio", count: 39, icon: Mic2, tone: "yellow" },
  { name: "Tecnologia", count: 112, icon: Sparkles, tone: "purple" },
];

export const services = [
  {
    id: "identidade-visual",
    title: "Criação de identidade visual completa e memorável",
    category: "Design",
    seller: "Marina Costa",
    role: "Designer de marcas",
    rating: 4.9,
    reviews: 124,
    price: 680,
    delivery: "7 dias",
    image:
      "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900",
    avatar: "https://i.pravatar.cc/160?img=47",
    badge: "Mais escolhido",
  },
  {
    id: "landing-page",
    title: "Landing page moderna focada em alta conversão",
    category: "Programação",
    seller: "Lucas Ribeiro",
    role: "Desenvolvedor front-end",
    rating: 5.0,
    reviews: 89,
    price: 950,
    delivery: "10 dias",
    image:
      "https://images.unsplash.com/photo-1506097425191-7ad538b29cef?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900",
    avatar: "https://i.pravatar.cc/160?img=12",
    badge: "Top freelancer",
  },
  {
    id: "social-media",
    title: "Conteúdo estratégico para suas redes sociais",
    category: "Marketing",
    seller: "Beatriz Lima",
    role: "Social media strategist",
    rating: 4.8,
    reviews: 76,
    price: 420,
    delivery: "5 dias",
    image:
      "https://images.unsplash.com/photo-1541506618330-7c369fc759b5?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900",
    avatar: "https://i.pravatar.cc/160?img=32",
    badge: "Entrega rápida",
  },
  {
    id: "edicao-video",
    title: "Edição de vídeo dinâmica para YouTube e Reels",
    category: "Vídeo",
    seller: "Rafael Torres",
    role: "Editor audiovisual",
    rating: 4.9,
    reviews: 103,
    price: 350,
    delivery: "4 dias",
    image:
      "https://images.unsplash.com/photo-1604074131228-9d48b811bd80?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900",
    avatar: "https://i.pravatar.cc/160?img=11",
    badge: "Talento verificado",
  },
];

export const freelancers = [
  { name: "Marina Costa", title: "Brand Designer", rating: "4.9", jobs: 184, avatar: "https://i.pravatar.cc/240?img=47", skill: "Identidade visual" },
  { name: "Lucas Ribeiro", title: "Front-end Developer", rating: "5.0", jobs: 97, avatar: "https://i.pravatar.cc/240?img=12", skill: "React & Webflow" },
  { name: "Beatriz Lima", title: "Marketing Strategist", rating: "4.8", jobs: 126, avatar: "https://i.pravatar.cc/240?img=32", skill: "Social media" },
  { name: "André Martins", title: "Copywriter", rating: "4.9", jobs: 143, avatar: "https://i.pravatar.cc/240?img=3", skill: "Conteúdo & SEO" },
];
