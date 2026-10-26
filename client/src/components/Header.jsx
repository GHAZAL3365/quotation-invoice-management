
import { Bell } from "lucide-react";

export default function Header() {
  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          Invoice Management
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage your business documents
        </p>
      </div>

      <button
        type="button"
        aria-label="Notifications"
        className="rounded-full border border-slate-200 p-3 text-slate-600 hover:bg-slate-50"
      >
        <Bell size={19} />
      </button>
    </header>
  );
}
