"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  PlusCircle,
  Layers,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/proposals", label: "Proposals", icon: FileText },
  { href: "/proposals/new", label: "New Proposal", icon: PlusCircle },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/templates", label: "Service Templates", icon: Layers },
];

const adminItems = [
  { href: "/users", label: "Manage Users", icon: UserCog },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white flex flex-col">
      {/* Brand */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1B5E20] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">4S</span>
          </div>
          <div>
            <h2 className="font-bold text-[#1B5E20] text-sm leading-tight">4 Seasons Greens</h2>
            <p className="text-xs text-muted-foreground">Proposal Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-medium text-muted-foreground px-3 mb-2 uppercase tracking-wider">
          Menu
        </p>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href) && item.href !== "/proposals/new")
                ? "bg-[#E8F5E9] text-[#1B5E20]"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}

        {profile.role === "admin" && (
          <>
            <div className="pt-4 pb-2">
              <p className="text-xs font-medium text-muted-foreground px-3 uppercase tracking-wider">
                Admin
              </p>
            </div>
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  pathname.startsWith(item.href)
                    ? "bg-[#E8F5E9] text-[#1B5E20]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#E8F5E9] flex items-center justify-center">
            <span className="text-[#1B5E20] font-medium text-xs">
              {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile.full_name || profile.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
