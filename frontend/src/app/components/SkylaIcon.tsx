/** SKYLA app icon — uses official logo PNG from /public/skyla-logo.png */
type SkylaIconProps = {
  size?: number;
  className?: string;
};

export default function SkylaIcon({ size = 40, className = "" }: SkylaIconProps) {
  return (
    <img
      src="/skyla-logo.png"
      alt=""
      width={size}
      height={size}
      className={`rounded-xl object-contain shrink-0 ${className}`}
      aria-hidden
    />
  );
}
