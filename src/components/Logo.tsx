import logo from "@/assets/sdmath-logo.png";
import { Link } from "@tanstack/react-router";

export function Logo({ size = 44, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3 group">
      <img
        src={logo}
        alt="SDMATH"
        width={size}
        height={size}
        className="object-contain transition-transform group-hover:scale-105"
        style={{ width: size, height: size }}
      />
      {withText && (
        <span className="text-lg font-bold tracking-tight text-primary">
          SDMATH
        </span>
      )}
    </Link>
  );
}
