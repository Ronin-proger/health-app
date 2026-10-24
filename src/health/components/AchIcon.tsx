import {
  Award,
  Dumbbell,
  Droplet,
  Flame,
  Footprints,
  Layers,
  Moon,
  PenLine,
  Star,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  flame: Flame,
  dumbbell: Dumbbell,
  layers: Layers,
  zap: Zap,
  trophy: Trophy,
  droplet: Droplet,
  moon: Moon,
  footprints: Footprints,
  star: Star,
  users: Users,
  pen: PenLine,
};

export function AchIcon({ name, size = 22 }: { name: string; size?: number }) {
  const Icon = MAP[name] ?? Award;
  return <Icon size={size} strokeWidth={2.1} />;
}
