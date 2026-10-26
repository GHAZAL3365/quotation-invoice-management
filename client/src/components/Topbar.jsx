import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, Menu, UserRound, Plus, Settings } from "lucide-react";

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <header className="z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4 sm:px-6">
      {/* Left: Mobile hamburger & title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open mobile menu"
          className="rounded-lg p-2 text-text-secondary hover:bg-slate-100 hover:text-text-primary lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div>
          <h2 className="text-base font-bold text-text-primary sm:text-lg">
            Ultrakey Management System
          </h2>
          <p className="hidden text-xs text-text-secondary sm:block">
            Invoices, Quotations, Clients & Payments
          </p>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick action button */}
        {isAdmin && (
          <Link
            to="/invoices/new"
            className="hidden items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-text-inverse transition-colors hover:bg-primary-hover sm:inline-flex"
          >
            <Plus size={15} />
            Create Invoice
          </Link>
        )}

        {isAdmin && (
          <Link
            to="/settings"
            title="Settings"
            className="rounded-lg p-2 text-text-secondary hover:bg-slate-100 hover:text-primary"
          >
            <Settings size={18} />
          </Link>
        )}

        {/* User profile & Logout */}
        <div className="flex items-center gap-3 border-l border-border pl-3 sm:pl-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserRound size={18} />
          </div>

          <div className="hidden md:block text-left">
            <p className="text-xs font-bold leading-tight text-text-primary">
              {user?.name || "Admin User"}
            </p>
            <p className="text-[11px] capitalize text-text-secondary">
              {user?.role || "Administrator"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            title="Sign out"
            className="flex items-center gap-1.5 rounded-lg p-2 text-text-secondary transition-colors hover:bg-red-50 hover:text-danger"
          >
            <LogOut size={18} />
            <span className="hidden text-xs font-medium sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
