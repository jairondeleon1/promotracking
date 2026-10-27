import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import UserMenu from "./UserMenu";

const LOGO_URL = "https://media.base44.com/images/public/69faa5f996eacad747354181/2c80b5888_logo.png";
const NAV = [
  { label: "Overview", to: "/" },
  { label: "Upload Data", to: "/upload" },
  { label: "Data Table", to: "/data-table" },
];

export default function TopBar({ isAdmin, children }) {
  const { pathname } = useLocation();
  return (
    <header className="bg-hero text-hero-foreground">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <img src={LOGO_URL} alt="Promoview" className="h-9 w-9 rounded-lg" />
          <span className="font-heading text-lg font-bold tracking-tight">Promoview</span>
        </Link>
        {isAdmin && (
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  pathname === n.to ? "bg-hero-foreground/10 text-hero-foreground" : "text-hero-muted hover:text-hero-foreground"
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-2">
          {children}
          <UserMenu isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}