import {
  Briefcase,
  Bus,
  Car,
  CircleEllipsis,
  Clapperboard,
  Coffee,
  Fuel,
  Gift,
  GraduationCap,
  Hammer,
  Home,
  HeartPulse,
  Key,
  Landmark,
  Laptop,
  Percent,
  Plane,
  Repeat,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Tag,
  TrendingUp,
  Undo2,
  Users,
  UtensilsCrossed,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  "for home": Home,
  "eating out": UtensilsCrossed,
  "food & dining": UtensilsCrossed,
  "tea/coffee": Coffee,
  fuel: Fuel,
  "car expenses": Car,
  transport: Bus,
  "personal care": Sparkles,
  "amma medical": HeartPulse,
  health: HeartPulse,
  entertainment: Clapperboard,
  travel: Plane,
  gifts: Gift,
  "gifts received": Gift,
  "appa spends": Users,
  "nandavanam expenses": Hammer,
  "paddlerz coaching": GraduationCap,
  education: GraduationCap,
  investment: TrendingUp,
  "mutual funds": TrendingUp,
  "home loan": Landmark,
  rent: Key,
  utilities: Zap,
  groceries: ShoppingCart,
  shopping: ShoppingBag,
  subscriptions: Repeat,
  miscellaneous: CircleEllipsis,
  other: CircleEllipsis,
  salary: Briefcase,
  freelance: Laptop,
  interest: Percent,
  refunds: Undo2,
  "other income": Wallet,
};

export function CategoryIcon({
  name,
  kind,
  className,
}: {
  name: string | null;
  kind: string;
  className?: string;
}) {
  const Icon = (name && ICONS[name.toLowerCase()]) || Tag;
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full",
        kind === "income" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600",
        className,
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}
