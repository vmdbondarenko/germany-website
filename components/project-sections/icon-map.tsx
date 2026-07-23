import {
  MapPin, Home, Car, TreePine, ShoppingBag, School, Train, Plane,
  Clock, Zap, Shield, Waves, Building, Sun, Star, Heart, Leaf, Bed,
  Bath, Ruler, Check, Snowflake, Flame, Shovel,
} from "lucide-react"

export const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  MapPin, Home, Car, TreePine, ShoppingBag, School, Train, Plane,
  Clock, Zap, Shield, Waves, Building, Sun, Star, Heart, Leaf, Bed,
  Bath, Ruler, Check, Snowflake, Flame, Shovel,
}

export function SectionIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const Icon = ICON_MAP[name] || MapPin
  return <Icon className={className} style={style} />
}
