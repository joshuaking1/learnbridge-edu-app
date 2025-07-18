// src/components/layout/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart,
  ShieldCheck,
  Settings,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// We will create this action file next
// import { signOut } from "@/app/auth/actions";

// Define the type for the user prop
type UserProfile = {
  full_name: string | null;
  avatar_url: string | null;
  email: string | undefined;
};

const navLinks = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/curriculum", icon: BookOpen, label: "Curriculum Mgmt" },
  { href: "/dashboard/users", icon: Users, label: "User Management" },
  { href: "/dashboard/questions", icon: HelpCircle, label: "Question Bank" },
  { href: "/dashboard/analytics", icon: BarChart, label: "Platform Analytics" },
  { href: "/dashboard/moderation", icon: ShieldCheck, label: "Moderation" },
];

const settingsLink = {
  href: "/dashboard/settings",
  icon: Settings,
  label: "Settings",
};

export const AdminSidebar = ({ user }: { user: UserProfile }) => {
  const pathname = usePathname();
  const fallbackInitial = user.full_name
    ? user.full_name.charAt(0).toUpperCase()
    : "A";

  return (
    <aside className="w-64 h-screen flex flex-col bg-slate-900 text-slate-200 p-4 fixed border-r border-slate-700">
      <div className="font-serif text-2xl font-bold mb-8 pl-2 text-white">
        LearnBridge <span className="text-brand-orange">Admin</span>
      </div>

      {/* User Profile Section */}
      <div className="flex items-center space-x-3 mb-8 border-t border-b border-slate-700 py-4">
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={user.avatar_url || undefined}
            alt={user.full_name || ""}
          />
          <AvatarFallback className="bg-brand-orange text-white">
            {fallbackInitial}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm text-white">{user.full_name}</p>
          <p className="text-xs text-slate-400">{user.email}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-grow">
        <ul className="space-y-1">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>
                <div
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md cursor-pointer transition-colors font-medium ${
                    pathname === link.href
                      ? "bg-brand-orange text-white"
                      : "hover:bg-slate-700"
                  }`}
                >
                  <link.icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Settings & Sign Out */}
      <div className="space-y-1 border-t border-slate-700 pt-2">
        <Link href={settingsLink.href}>
          <div
            className={`flex items-center space-x-3 px-3 py-2 rounded-md cursor-pointer transition-colors font-medium ${
              pathname === settingsLink.href
                ? "bg-slate-700"
                : "hover:bg-slate-700"
            }`}
          >
            <settingsLink.icon className="h-5 w-5" />
            <span>{settingsLink.label}</span>
          </div>
        </Link>
        <form action={"/api/auth/signout"} method="post">
          {" "}
          {/* Placeholder action */}
          <button
            type="submit"
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left hover:bg-slate-700 transition-colors font-medium"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  );
};
