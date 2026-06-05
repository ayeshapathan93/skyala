import { Outlet } from "react-router";
import { CheckCircle2 } from "lucide-react";
import SkylaLogo from "../components/SkylaLogo";

const features = [
  "Create invoices and track payments",
  "Manage customers and product inventory",
  "Real-time stock alerts and sales reports",
];

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex bg-background">
      <div className="hidden lg:flex lg:w-[48%] xl:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#1A5276] via-[#2471A3] to-[#1E8449] text-white p-10 xl:p-14 flex-col justify-between">
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute -top-16 -left-16 w-72 h-72 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#58D68D]/25 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <SkylaLogo variant="brand" size="lg" className="[&_span]:text-white [&_span.text-brand-green]:text-[#A9DFBF]" />
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-3xl xl:text-4xl font-bold leading-tight mb-4">
            Manage billing & inventory smarter
          </h1>
          <p className="text-white/85 text-base xl:text-lg leading-relaxed mb-8">
            Everything you need to run your shop — customers, products, invoices, and stock — in one place.
          </p>
          <ul className="space-y-3">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-white/90">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#A9DFBF]" aria-hidden />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-sm text-white/60">© {new Date().getFullYear()} SKYLA Organic & Herbal</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <Outlet />
      </div>
    </div>
  );
}
