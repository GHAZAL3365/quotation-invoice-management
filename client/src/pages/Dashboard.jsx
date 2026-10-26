import { useEffect, useState, useTransition } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  FileText,
  FileSpreadsheet,
  CreditCard,
  CircleDollarSign,
  ArrowRight,
  Plus,
  ArrowUpRight,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { getInvoices, downloadInvoicePdf } from "../api/invoiceApi";
import quotationService from "../api/quotationApi";
import { getClients } from "../api/clientApi";
import { useAuth } from "../context/AuthContext";
import ClientDashboard from "./ClientDashboard";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(status) {
  const norm = String(status || "").toLowerCase();
  if (norm === "paid" || norm === "accepted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
        <CheckCircle2 size={12} />
        {status}
      </span>
    );
  }
  if (norm === "partially paid" || norm === "partial") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 border border-sky-200">
        <Clock size={12} />
        {status}
      </span>
    );
  }
  if (norm === "unpaid" || norm === "sent") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
        <Clock size={12} />
        {status}
      </span>
    );
  }
  if (norm === "overdue" || norm === "declined") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
        <AlertCircle size={12} />
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
      {status || "Draft"}
    </span>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [clients, setClients] = useState([]);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [invRes, quoteRes, clientRes] = await Promise.allSettled([
        getInvoices({ limit: 20 }),
        quotationService.getQuotations({ limit: 20 }),
        getClients({ limit: 20 }),
      ]);

      if (invRes.status === "fulfilled") {
        const raw = invRes.value?.data?.data ?? invRes.value?.data ?? [];
        setInvoices(raw.invoices ?? (Array.isArray(raw) ? raw : []));
      }

      if (quoteRes.status === "fulfilled") {
        const raw = quoteRes.value?.data ?? quoteRes.value ?? [];
        setQuotations(raw.quotations ?? (Array.isArray(raw) ? raw : []));
      }
      if (clientRes.status === "fulfilled") {
        const raw = clientRes.value?.data ?? clientRes.value ?? [];
        setClients(raw.clients ?? (Array.isArray(raw) ? raw : []));
      }
    } catch (err) {
      setError("Failed to load dashboard metrics. Pulling offline data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute key financials
  const totalInvoiced = invoices.reduce(
    (sum, inv) => sum + (Number(inv.total) || 0),
    0
  );
  const totalPaid = invoices.reduce(
    (sum, inv) => sum + (Number(inv.paidAmount) || 0),
    0
  );
  const totalOutstanding = Math.max(0, totalInvoiced - totalPaid);

  const totalQuotesValue = quotations.reduce(
    (sum, q) => sum + (Number(q.total) || 0),
    0
  );

  const collectionRate =
    totalInvoiced > 0
      ? Math.min(100, Math.round((totalPaid / totalInvoiced) * 100))
      : 0;

  const paidInvoicesCount = invoices.filter(
    (i) => String(i.status).toLowerCase() === "paid"
  ).length;
  const unpaidInvoicesCount = invoices.filter(
    (i) =>
      String(i.status).toLowerCase() === "unpaid" ||
      String(i.status).toLowerCase() === "partially paid"
  ).length;

  const handleDownloadInvoice = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await downloadInvoicePdf(id);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download error:", err);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Top Banner / Welcome */}
      <section className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#203B5B] via-[#2A4D75] to-[#597B9B] p-6 text-white shadow-md sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-xs">
              <Building2 size={13} />
              <span>Ultrakey IT Solutions Private Limited</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Welcome back, {user?.name || "Admin"}!
            </h1>
            <p className="max-w-xl text-xs text-blue-100 sm:text-sm">
              Here is your financial and billing overview. You have{" "}
              <span className="font-bold text-white">
                {invoices.length} invoices
              </span>{" "}
              and{" "}
              <span className="font-bold text-white">
                {quotations.length} quotations
              </span>{" "}
              managed in the system.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/invoices/new"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#203B5B] shadow-sm transition hover:bg-blue-50"
            >
              <Plus size={16} />
              New Invoice
            </Link>
            <Link
              to="/quotations/new"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-xs transition hover:bg-white/25"
            >
              <Plus size={16} />
              New Quotation
            </Link>
            <button
              onClick={fetchData}
              title="Refresh Data"
              className="rounded-xl bg-white/10 p-2.5 text-white transition hover:bg-white/20"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </section>

      {/* KPI Stats Grid */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Invoiced */}
        <article className="rounded-2xl border border-border bg-surface p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-text-secondary">
                Total Invoiced
              </p>
              <p className="mt-2 text-2xl font-black text-text-primary">
                {formatCurrency(totalInvoiced)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-primary">
              <FileText size={22} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-text-secondary border-t border-border pt-3">
            <span>{invoices.length} Total Invoices</span>
            <Link
              to="/invoices"
              className="font-semibold text-primary hover:underline"
            >
              View all
            </Link>
          </div>
        </article>

        {/* Total Paid / Collected */}
        <article className="rounded-2xl border border-border bg-surface p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-text-secondary">
                Total Collected
              </p>
              <p className="mt-2 text-2xl font-black text-emerald-600">
                {formatCurrency(totalPaid)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CreditCard size={22} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-text-secondary border-t border-border pt-3">
            <span>{paidInvoicesCount} Fully Paid</span>
            <span className="font-semibold text-emerald-700">
              {collectionRate}% Collected
            </span>
          </div>
        </article>

        {/* Outstanding Due */}
        <article className="rounded-2xl border border-border bg-surface p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-text-secondary">
                Total Outstanding
              </p>
              <p className="mt-2 text-2xl font-black text-amber-600">
                {formatCurrency(totalOutstanding)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <CircleDollarSign size={22} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-text-secondary border-t border-border pt-3">
            <span>{unpaidInvoicesCount} Pending Invoices</span>
            <Link
              to="/payments"
              className="font-semibold text-amber-700 hover:underline"
            >
              Record Payment
            </Link>
          </div>
        </article>

        {/* Clients & Quotes */}
        <article className="rounded-2xl border border-border bg-surface p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-text-secondary">
                Active Quotations
              </p>
              <p className="mt-2 text-2xl font-black text-text-primary">
                {formatCurrency(totalQuotesValue)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FileSpreadsheet size={22} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-text-secondary border-t border-border pt-3">
            <span>{quotations.length} Active Quotes</span>
            <Link
              to="/quotations"
              className="font-semibold text-indigo-600 hover:underline"
            >
              View quotes
            </Link>
          </div>
        </article>
      </section>

      {/* Progress & Summary Bar */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Payment Collection Progress
            </h3>
            <p className="text-xs text-text-secondary">
              Collected {formatCurrency(totalPaid)} out of{" "}
              {formatCurrency(totalInvoiced)} billed to clients
            </p>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-primary">
              {collectionRate}%
            </span>
            <span className="text-xs text-text-secondary ml-1.5">collected</span>
          </div>
        </div>

        {/* Progress track */}
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-linear-to-r from-[#203B5B] to-emerald-500 transition-all duration-500"
            style={{ width: `${collectionRate}%` }}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-6 text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <span>Paid: {formatCurrency(totalPaid)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-500" />
            <span>Outstanding: {formatCurrency(totalOutstanding)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-indigo-500" />
            <span>Quoted: {formatCurrency(totalQuotesValue)}</span>
          </div>
        </div>
      </section>

      {/* Dual Tables: Recent Invoices & Recent Quotations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Invoices Card */}
        <section className="flex flex-col rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-blue-50 p-2 text-primary">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  Recent Invoices
                </h3>
                <p className="text-xs text-text-secondary">
                  Latest customer billing records
                </p>
              </div>
            </div>

            <Link
              to="/invoices"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {invoices.length === 0 ? (
              <div className="py-12 text-center text-xs text-text-secondary">
                No invoices found. Click "New Invoice" to create one.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 text-text-secondary font-semibold border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.slice(0, 5).map((inv) => {
                    const clientName =
                      inv.clientId?.clientName ||
                      inv.clientId?.name ||
                      inv.clientName ||
                      "Client";
                    return (
                      <tr
                        key={inv._id}
                        className="transition-colors hover:bg-slate-50/50 cursor-pointer"
                        onClick={() => navigate(`/invoices/${inv._id}`)}
                      >
                        <td className="py-3.5 px-4 font-bold text-primary">
                          {inv.invoiceNumber || inv._id?.slice(-6)}
                        </td>
                        <td className="py-3.5 px-4 max-w-[140px] truncate text-text-primary font-medium">
                          {clientName}
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(inv.status)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-text-primary">
                          {formatCurrency(inv.total)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Link
                            to={`/invoices/${inv._id}`}
                            className="inline-flex rounded-lg p-1.5 text-text-secondary hover:bg-slate-100 hover:text-primary"
                            title="View Invoice"
                          >
                            <Eye size={15} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="border-t border-border p-3 text-center bg-slate-50/50">
            <Link
              to="/invoices/new"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <Plus size={14} /> Add New Invoice
            </Link>
          </div>
        </section>

        {/* Recent Quotations Card */}
        <section className="flex flex-col rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  Recent Quotations
                </h3>
                <p className="text-xs text-text-secondary">
                  Active proposals and estimates
                </p>
              </div>
            </div>

            <Link
              to="/quotations"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {quotations.length === 0 ? (
              <div className="py-12 text-center text-xs text-text-secondary">
                No quotations yet. Click "New Quotation" to create one.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 text-text-secondary font-semibold border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Quote #</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {quotations.slice(0, 5).map((q) => {
                    const clientName =
                      q.clientId?.clientName ||
                      q.clientId?.name ||
                      q.clientName ||
                      "Client";
                    return (
                      <tr
                        key={q._id}
                        className="transition-colors hover:bg-slate-50/50 cursor-pointer"
                        onClick={() => navigate(`/quotations/${q._id}`)}
                      >
                        <td className="py-3.5 px-4 font-bold text-indigo-600">
                          {q.quotationNumber || q._id?.slice(-6)}
                        </td>
                        <td className="py-3.5 px-4 max-w-[140px] truncate text-text-primary font-medium">
                          {clientName}
                        </td>
                        <td className="py-3.5 px-4">{getStatusBadge(q.status)}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-text-primary">
                          {formatCurrency(q.total)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Link
                            to={`/quotations/${q._id}`}
                            className="inline-flex rounded-lg p-1.5 text-text-secondary hover:bg-slate-100 hover:text-indigo-600"
                            title="View Quotation"
                          >
                            <Eye size={15} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="border-t border-border p-3 text-center bg-slate-50/50">
            <Link
              to="/quotations/new"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline"
            >
              <Plus size={14} /> Add New Quotation
            </Link>
          </div>
        </section>
      </div>

      {/* Quick Access Client Directory */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Client Directory ({clients.length})
              </h3>
              <p className="text-xs text-text-secondary">
                Registered corporate and individual accounts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/clients"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-slate-50"
            >
              Manage Clients <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {clients.length > 0 && (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clients.slice(0, 6).map((c) => (
              <div
                key={c._id}
                className="flex items-center justify-between rounded-xl border border-border bg-slate-50/50 p-3.5 transition hover:bg-slate-100/70"
              >
                <div className="min-w-0 pr-3">
                  <p className="truncate text-xs font-bold text-text-primary">
                    {c.clientName || "Unnamed Client"}
                  </p>
                  <p className="truncate text-[11px] text-text-secondary">
                    {c.email || c.phone || "No contact"}
                  </p>
                </div>
                <Link
                  to={`/invoices/new?clientId=${c._id}`}
                  className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-primary border border-border hover:bg-primary hover:text-white transition"
                >
                  Bill Client
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  return user?.role === "client" ? <ClientDashboard /> : <AdminDashboard />;
}
