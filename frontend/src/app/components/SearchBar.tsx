import { Search } from "lucide-react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  /** inline = field only (use inside filter toolbars or other panels) */
  variant?: "default" | "inline";
};

export default function SearchBar({
  value,
  onChange,
  placeholder,
  className = "",
  variant = "default",
}: SearchBarProps) {
  const field = (
    <div className="relative flex-1 min-w-0">
      <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-field"
      />
    </div>
  );

  if (variant === "inline") {
    return <div className={className}>{field}</div>;
  }

  return <div className={`search-toolbar ${className}`}>{field}</div>;
}
