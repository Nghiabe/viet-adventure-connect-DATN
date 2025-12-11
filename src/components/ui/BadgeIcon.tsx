import { cn } from "@/lib/utils";
import { Camera, Mountain, Plane, Trophy, Star, Heart, Compass, Users, Calendar, Award, MapPin, Image as ImageIcon, Utensils } from "lucide-react";

interface BadgeIconProps {
  iconName?: string | null; // could be a name or URL
  className?: string;
  earned?: boolean;
  title?: string;
}

const iconMap: Record<string, any> = {
  airplane: Plane,
  plane: Plane,
  camera: Camera,
  mountain: Mountain,
  trophy: Trophy,
  star: Star,
  heart: Heart,
  compass: Compass,
  users: Users,
  calendar: Calendar,
  award: Award,
  mappin: MapPin,
  location: MapPin,
  image: ImageIcon,
  food: Utensils,
};

const BadgeIcon = ({ iconName, className = "w-10 h-10", earned = false, title }: BadgeIconProps) => {
  const lower = (iconName || "").toLowerCase().trim();

  // If it's a URL, render as an <img>
  const isUrl = /^https?:\/\//.test(lower) || lower.startsWith("/uploads") || lower.startsWith("/images");
  if (isUrl) {
    return (
      <img
        src={iconName as string}
        alt={title || "badge"}
        className={cn("object-contain", className, earned ? "opacity-100" : "grayscale opacity-60")}
      />
    );
  }

  // If it's a known icon key, render lucide icon
  const Icon = lower && iconMap[lower] ? iconMap[lower] : null;
  if (Icon) {
    return <Icon className={cn(className)} />;
  }

  // Fallback to initials from title or iconName
  const fallback = (title || iconName || "BH").toString().slice(0, 2).toUpperCase();
  return <span className={cn("font-bold", className)}>{fallback}</span>;
};

export default BadgeIcon;
