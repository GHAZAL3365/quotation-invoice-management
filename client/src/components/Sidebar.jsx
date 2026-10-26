import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  FileSpreadsheet,
  Wallet,
  Settings,
  X,
  PlusCircle,
  Building2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const adminNavigation = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Clients", path: "/clients", icon: Users },
  { label: "Invoices", path: "/invoices", icon: FileText },
  { label: "Quotations", path: "/quotations", icon: FileSpreadsheet },
  { label: "Payments", path: "/payments", icon: Wallet },
  { label: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const isClient = user?.role === "client";
  const navigation = isClient
    ? [
        { label: "Dashboard", path: "/", icon: LayoutDashboard },
        { label: "Invoices", path: "/invoices", icon: FileText },
        { label: "Quotations", path: "/quotations", icon: FileSpreadsheet },
      ]
    : adminNavigation;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col bg-[#203B5B] text-white transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:shrink-0 lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Header / Brand */}
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl font-bold text-[#203B5B] shadow-sm">
              <span className="tracking-tight">U</span>
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight text-white">
                Ultrakey
              </h1>
              <p className="truncate text-xs font-normal text-blue-200">
                Invoice & Quotation
              </p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-blue-200 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick create actions */}
        {!isClient && (
          <div className="px-4 pt-5 pb-2">
            <div className="flex gap-2">
            <NavLink
              to="/invoices/new"
              onClick={onClose}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/10 py-2 px-2 text-xs font-semibold text-white transition-colors hover:bg-white/20"
            >
              <PlusCircle size={14} />
              + Invoice
            </NavLink>
            <NavLink
              to="/quotations/new"
              onClick={onClose}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#597B9B] py-2 px-2 text-xs font-semibold text-white transition-colors hover:bg-[#486785]"
            >
              <PlusCircle size={14} />
              + Quote
            </NavLink>
            </div>
          </div>
        )}

        {/* Navigation links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-4">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-blue-300/80">
            Navigation
          </p>
          {navigation.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#597B9B] text-white shadow-xs"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon size={18} strokeWidth={2} className="shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Business details footer card */}
        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl bg-white/5 p-3 text-xs">
            <div className="flex items-center gap-2 font-medium text-white">
              <Building2 size={15} className="text-blue-300" />
              <span>Ultrakey IT Solutions</span>
            </div>
            <p className="mt-1 text-[11px] text-blue-200/80">
              GST: 36AADCU5062A1Z0
            </p>
            <p className="text-[10px] text-blue-300/70">
              support@ultrakeyit.com
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
