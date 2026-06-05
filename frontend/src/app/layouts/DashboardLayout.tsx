import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  Warehouse,
  FileText,
  BarChart3,
  Bell,
  Settings,
  Menu,
  X,
  Plus,
  LogOut,
  MoreHorizontal,
} from "lucide-react";
import { api, authStore } from "../lib/api";
import SkylaLogo from "../components/SkylaLogo";

const mainNav = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Customers", path: "/customers" },
  { icon: Package, label: "Products", path: "/products" },
  { icon: Warehouse, label: "Inventory", path: "/inventory" },
  { icon: FileText, label: "Billing", path: "/bills" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const bottomNav = [
  { icon: LayoutDashboard, label: "Home", path: "/" },
  { icon: FileText, label: "Bills", path: "/bills" },
  { icon: Plus, label: "New", path: "/bills/create", highlight: true },
  { icon: Package, label: "Products", path: "/products" },
  { icon: MoreHorizontal, label: "Menu", path: "__menu__" },
];

export default function DashboardLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    if (!authStore.getToken()) {
      navigate("/login");
      return;
    }
    api.me()
      .then((d) => setProfile({ name: d.user.name, email: d.user.email }))
      .catch(() => {
        authStore.clear();
        navigate("/login");
      });
  }, [navigate]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const logout = () => {
    authStore.clear();
    navigate("/login");
  };

  const NavLink = ({ item, onNavigate }: { item: (typeof mainNav)[0]; onNavigate?: () => void }) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    return (
      <Link
        to={item.path}
        onClick={onNavigate}
        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors min-h-[48px] ${
          active
            ? "nav-active shadow-sm"
            : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        }`}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <span className="font-medium">{item.label}</span>
      </Link>
    );
  };

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <div className="p-4 border-b border-sidebar-border">
        <SkylaLogo variant="brand" size="sm" className="[&_span]:text-sidebar-foreground [&_.text-brand-green]:text-[#58D68D]" />
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {mainNav.map((item) => (
          <NavLink key={item.path} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <p className="text-xs text-sidebar-foreground/70 truncate px-1">{profile?.name}</p>
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            logout();
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sidebar-foreground/80 hover:bg-sidebar-accent/50 min-h-[48px] text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Sidebar — desktop always visible, mobile drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[min(300px,88vw)] bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-out
          lg:translate-x-0 lg:w-[272px]
          ${drawerOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg text-sidebar-foreground lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent onNavigate={() => setDrawerOpen(false)} />
      </aside>

      {/* Main column */}
      <div className="lg:pl-[272px] flex flex-col min-h-screen">
        {/* Top bar — mobile compact */}
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 h-14 sm:h-16">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-muted min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 text-primary" />
            </button>

            <div className="lg:hidden shrink-0">
              <SkylaLogo variant="icon" size="sm" />
            </div>

            <div className="hidden lg:flex flex-1 items-center gap-3 min-w-0">
              <SkylaLogo variant="brand" size="sm" />
              <span className="text-sm text-muted-foreground hidden xl:inline">
                Welcome, {profile?.name || "Admin"}
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 ml-auto">
              <Link
                to="/bills/create"
                className="hidden sm:flex btn-brand text-sm py-2 px-4 min-h-[40px]"
              >
                <Plus className="w-4 h-4" />
                New Bill
              </Link>
              <Link
                to="/notifications"
                className="p-2.5 rounded-xl hover:bg-muted relative min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-primary" />
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 px-3 sm:px-5 py-4 sm:py-6 max-w-6xl w-full mx-auto mobile-main-pad">
          <Outlet />
        </main>
      </div>

      {/* Bottom navigation — mobile only */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-[0_-4px_20px_rgba(15,39,68,0.08)] safe-bottom"
        aria-label="Main navigation"
      >
        <div className="flex items-stretch justify-around px-1 pt-1">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            const isMenu = item.path === "__menu__";
            const active = !isMenu && isActive(item.path);
            const highlight = "highlight" in item && item.highlight;

            if (isMenu) {
              return (
                <button
                  key="menu"
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="flex flex-col items-center justify-center flex-1 py-2 min-h-[56px] text-muted-foreground"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] mt-0.5 font-medium">Menu</span>
                </button>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 py-2 min-h-[56px] text-[10px] font-medium gap-0.5 ${
                  highlight
                    ? ""
                    : active
                      ? "text-primary"
                      : "text-muted-foreground"
                }`}
              >
                <span
                  className={`flex items-center justify-center rounded-2xl transition-all ${
                    highlight
                      ? "bg-primary text-primary-foreground p-2.5 -mt-5 shadow-lg shadow-primary/30 ring-4 ring-card"
                      : "p-1.5"
                  }`}
                >
                  <Icon className={highlight ? "w-6 h-6" : "w-5 h-5"} />
                </span>
                <span className={highlight ? "text-primary mt-1" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
