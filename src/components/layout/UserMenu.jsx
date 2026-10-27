import React from "react";
import { Link } from "react-router-dom";
import { LogOut, Upload, Table2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UserMenu({ isAdmin }) {
  const { user, logout } = useAuth();
  const initials = (user?.full_name || user?.email || "?")
    .split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account menu"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-highlight text-sm font-semibold text-highlight-foreground ring-2 ring-hero-foreground/15"
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="truncate text-sm font-semibold">{user?.full_name || "Signed in"}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{user?.email}</p>
        </DropdownMenuLabel>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/upload"><Upload className="h-4 w-4" /> Upload data</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/data-table"><Table2 className="h-4 w-4" /> Data table</Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => logout()}>
          <LogOut className="h-4 w-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}