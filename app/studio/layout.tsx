"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock,
  BarChart3,
  CheckCircle,
  CalendarCheck,
  Tag,
  Image as ImageIcon,
  Inbox,
  Calendar,
  FileText,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

interface StudioLayoutProps {
  children: React.ReactNode;
}

export default function StudioLayout({ children }: StudioLayoutProps) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingDepositsCount, setPendingDepositsCount] = useState<number>(0);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Load user session
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});

    // Fetch pending deposits count for badge
    fetch("/api/admin/deposits")
      .then((res) => res.json())
      .then((data) => {
        if (data.deposits) {
          setPendingDepositsCount(data.deposits.length);
        }
      })
      .catch(() => {});
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/studio/login";
  }

  // Navigation Items
  const navItems = [
    { href: "/studio", label: "TODAY OVERVIEW", icon: Clock },
    { href: "/studio/pipeline", label: "PIPELINE BOARD", icon: BarChart3 },
    {
      href: "/studio/deposits",
      label: "DEPOSIT QUEUE",
      icon: CheckCircle,
      badge: pendingDepositsCount > 0 ? pendingDepositsCount : undefined,
    },
    { href: "/studio/bookings", label: "BOOKINGS TRACKER", icon: CalendarCheck },
    { href: "/studio/services", label: "SERVICES & PRICING", icon: Tag },
    { href: "/studio/gallery", label: "GALLERY MANAGER", icon: ImageIcon },
    { href: "/studio/inbox", label: "HUMAN INBOX", icon: Inbox },
    { href: "/studio/calendar", label: "CONTENT CALENDAR", icon: Calendar },
    { href: "/studio/content", label: "SITE CONTENT CMS", icon: FileText },
    { href: "/studio/settings", label: "STUDIO SETTINGS", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-cream text-deep flex flex-col">
      {/* Studio Top Navigation Bar */}
      <header className="bg-deep text-warm-white border-b border-warm-white/10 px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        {/* Left: Mobile Drawer Trigger + Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 -ml-1 rounded-xl text-gold hover:bg-white/10 transition-colors"
            aria-label="Toggle navigation drawer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/" className="font-display text-lg sm:text-xl font-semibold text-warm-white tracking-tight flex items-center gap-1.5">
            <span>LamSparks</span>
            <span className="text-gold text-xs font-serif font-normal">●</span>
          </Link>

          <span className="text-[10px] font-mono tracking-widest uppercase bg-warm-white/10 text-gold px-2.5 py-0.5 rounded-full border border-warm-white/10 hidden sm:inline-block">
            Studio Operating System
          </span>
        </div>

        {/* Right: User Status, Public Site & Sign Out */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-body text-cream/75">
            <span>Logged in as</span>
            <strong className="text-warm-white font-medium truncate max-w-[140px]">
              {currentUser?.name || "Osemene"}
            </strong>
            <span className="text-[10px] font-mono uppercase bg-gold/20 text-gold px-1.5 py-0.2 rounded border border-gold/30">
              {currentUser?.role || "owner"}
            </span>
          </div>

          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-body text-cream/70 hover:text-gold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-warm-white/5 transition-colors whitespace-nowrap"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warm-white/10 hover:bg-red-500/20 text-cream/80 hover:text-red-300 text-xs font-body font-semibold transition-all border border-warm-white/15 whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5 text-gold shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Mobile Slide-out Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative w-4/5 max-w-xs bg-deep text-warm-white border-r border-warm-white/10 p-5 flex flex-col justify-between z-10 shadow-2xl animate-in slide-in-from-left duration-300">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg font-semibold text-warm-white">LamSparks</span>
                  <span className="text-[10px] font-mono uppercase bg-gold/20 text-gold px-2 py-0.5 rounded">Studio</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-cream/70 hover:text-warm-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5 overflow-y-auto max-h-[70vh] no-scrollbar">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/studio"
                      ? pathname === "/studio"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-body text-xs uppercase tracking-wider font-semibold transition-all ${
                        isActive
                          ? "bg-gold text-deep font-bold shadow-md"
                          : "text-cream/80 hover:bg-white/10 hover:text-warm-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-deep" : "text-gold"}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="w-5 h-5 rounded-full bg-deep text-gold text-[10px] font-bold flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-white/10 text-[11px] font-body text-cream/50">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Abuja Studio Active</span>
              </div>
              <span>LamSparks Studio OS v2.4</span>
            </div>
          </aside>
        </div>
      )}

      {/* Main Studio Workspace with Desktop Sticky Sidebar */}
      <div className="flex-1 flex flex-col md:flex-row min-w-0 w-full overflow-x-hidden">
        {/* Desktop Sidebar Nav (md:flex, hidden on mobile) */}
        <aside className="hidden md:flex w-64 bg-[#FAF8F5] border-r border-[#EFE9E1] p-4 shrink-0 sticky top-[57px] h-[calc(100vh-57px)] flex-col justify-between select-none z-30">
          <nav className="w-full space-y-1.5 overflow-y-auto no-scrollbar">
            {navItems.map((tab) => {
              const Icon = tab.icon;
              const isActive =
                tab.href === "/studio"
                  ? pathname === "/studio"
                  : pathname.startsWith(tab.href);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-body text-xs uppercase tracking-wider font-bold transition-all whitespace-nowrap text-left ${
                    isActive
                      ? "bg-[#181411] text-warm-white shadow-md"
                      : "text-[#736253] hover:bg-[#F2ECE3] hover:text-[#181411]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#C9A96E]" : "text-[#B89874]"}`} />
                    <span className="font-semibold">{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className="w-5 h-5 rounded-full bg-[#B88746] text-[#181411] text-[11px] font-bold flex items-center justify-center shrink-0 ml-2">
                      {tab.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-[#EFE9E1]">
            <div className="flex items-center gap-2 text-[11px] text-muted font-body">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Abuja Studio Active</span>
            </div>
            <p className="text-[10px] text-muted/80 mt-0.5">LamSparks Studio OS v2.4</p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
