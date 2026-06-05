import SkylaIcon from "./SkylaIcon";

type SkylaLogoProps = {
  /** icon = app mark only | brand = icon + wordmark | full = PNG marketing logo */
  variant?: "icon" | "brand" | "full";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const iconSizes = { sm: 32, md: 40, lg: 48 };
const fullHeights = { sm: 40, md: 52, lg: 64 };

export default function SkylaLogo({ variant = "brand", size = "md", className = "" }: SkylaLogoProps) {
  if (variant === "full") {
    return (
      <img
        src="/skyla-logo.png"
        alt="SKYLA Organic & Herbal"
        width={fullHeights[size] * 2}
        height={fullHeights[size]}
        className={`object-contain w-auto max-w-[min(100%,280px)] ${className}`}
      />
    );
  }

  if (variant === "icon") {
    return <SkylaIcon size={iconSizes[size]} className={className} />;
  }

  const textScale = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";

  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      <SkylaIcon size={iconSizes[size]} className="shrink-0" />
      <div className="min-w-0 leading-tight">
        <span className={`font-bold tracking-tight text-primary ${textScale}`}>SKYLA</span>
        <span className="block text-[10px] sm:text-xs font-semibold text-brand-green truncate">
          Organic & Herbal
        </span>
      </div>
    </div>
  );
}
