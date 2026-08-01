import {
  MapPin,
  Home,
  Trees,
  Settings,
  Layers,
  PenLine,
  ArrowUpToLine,
  HandCoins,
  Hammer,
  KeyRound,
  ShieldCheck,
  Award,
  Gem,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

// Maps an admin-supplied icon name (stored on HomeSectionItem.icon) to a
// lucide-react component. Unknown names fall back to Sparkles.
const ICONS: Record<string, LucideIcon> = {
  MapPin,
  Home,
  Trees,
  Settings,
  Layers,
  PenLine,
  ArrowUpToLine,
  HandCoins,
  Hammer,
  KeyRound,
  ShieldCheck,
  Award,
  Gem,
  Sparkles,
}

export function DynamicIcon({
  name,
  className,
  style,
}: {
  name: string
  className?: string
  style?: React.CSSProperties
}) {
  const Icon = ICONS[name] ?? Sparkles
  return <Icon className={className} style={style} />
}
