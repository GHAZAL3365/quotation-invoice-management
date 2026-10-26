
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Download,
  Eye,
  FilePlus2,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

import {
  deleteInvoice,
  downloadInvoicePdf,
  getInvoices,
} from "../api/invoiceApi";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  "All",
  "Draft",
  "Unpaid",
  "Partially Paid",
  "Paid",
];

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? {};
}

function getInvoiceRows(result) {
  if (Array.isArray(result)) return result;

  return (
    result?.invoices ??
    result?.items ??
    result?.results ??
    result?.data?.invoices ??
    []
  );
}

function getPagination(result, fallbackPage) {
  const pagination = result?.pagination ?? result?.meta ?? {};

  return {
    page: Number(pagination.page ?? fallbackPage),
    totalPages: Number(
      pagination.totalPages ??
      pagination.totalPagesCount ??
      1
    ),
    total: Number(
      pagination.total ??
      pagination.totalRecords ??
      pagination.totalItems ??
      0
    ),
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
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

function getClientName(invoice) {
  const client = invoice.clientId ?? invoice.client;

  if (client && typeof client === "object") {
    return client.clientName ?? client.name ?? "Unknown client";
  }

  return invoice.clientName ?? "Unknown client";
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ??
    error?.response?.data?.error ??
    error?.message ??
    "Something went wrong. Please try again."
  );
}

function StatusBadge({ status }) {
  const styles = {
    Draft: "bg-slate-100 text-slate-700",
    Unpaid: "bg-amber-100 text-amber-800",
    "Partially Paid": "bg-blue-100 text-blue-800",
    Paid: "bg-green-100 text-green-800",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
}

export default function Invoices() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const navigate = useNavigate();
  const location = useLocation();

  const [invoices, setInvoices] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page,
        limit: PAGE_SIZE,
      };

      if (search) params.search = search;
      if (status !== "All") params.status = status;

      const response = await getInvoices(params);
      const result = unwrap(response);

      setInvoices(getInvoiceRows(result));
      setPagination(getPagination(result, page));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = async (invoice) => {
    const confirmed = window.confirm(
      `Delete invoice ${invoice.invoiceNumber}?`
    );

    if (!confirmed) return;

    setDeletingId(invoice._id);
    setError("");
    setNotice("");

    try {
      await deleteInvoice(invoice._id);

      setNotice("Invoice deleted successfully.");

      if (invoices.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadInvoices();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (invoice) => {
    setDownloadingId(invoice._id);
    setError("");

    try {
      const response = await downloadInvoicePdf(invoice._id);
      const blob = new Blob([response.data], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = `${invoice.invoiceNumber || "invoice"}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDownloadingId(null);
    }
  };

  const changeStatus = (nextStatus) => {
    setPage(1);
    setStatus(nextStatus);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Invoices
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {isAdmin
              ? "Create, manage, and download invoices."
              : "View and download your invoices."}
          </p>
        </div>

        {isAdmin && (
          <Link
            to="/invoices/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            <FilePlus2 size={18} />
            Create invoice
          </Link>
        )}
      </div>

      {notice && (
        <div
          role="status"
          className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          {notice}
          <button
            type="button"
            onClick={() => setNotice("")}
            className="font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={loadInvoices}
            className="font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search invoice number..."
              className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-text-primary outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor="invoice-status"
              className="text-sm text-text-secondary"
            >
              Status
            </label>
            <select
              id="invoice-status"
              value={status}
              onChange={(event) => changeStatus(event.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-secondary"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={loadInvoices}
              disabled={loading}
              title="Refresh invoices"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm text-text-primary hover:bg-surface-muted disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left">
            <thead>
              <tr className="border-y border-border bg-surface-muted text-xs uppercase tracking-wide text-text-secondary">
                <th className="px-4 py-3 font-semibold">Invoice</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Invoice date</th>
                <th className="px-4 py-3 font-semibold">Due date</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-text-secondary"
                  >
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center"
                  >
                    <p className="font-medium text-text-primary">
                      No invoices found
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {isAdmin
                        ? "Try changing your search or create a new invoice."
                        : "There are no invoices matching your filters."}
                    </p>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr
                    key={invoice._id}
                    className="transition hover:bg-surface-muted/60"
                  >
                    <td className="px-4 py-4">
                      <span className="font-semibold text-primary">
                        {invoice.invoiceNumber || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-text-primary">
                      {getClientName(invoice)}
                    </td>
                    <td className="px-4 py-4 text-sm text-text-secondary">
                      {formatDate(invoice.invoiceDate)}
                    </td>
                    <td className="px-4 py-4 text-sm text-text-secondary">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-semibold text-text-primary">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title="View invoice"
                          onClick={() =>
                            navigate(`/invoices/${invoice._id}`)
                          }
                          className="rounded-md p-2 text-text-secondary hover:bg-blue-50 hover:text-info"
                        >
                          <Eye size={17} />
                        </button>

                        {isAdmin && invoice.status !== "Paid" && (
                          <button
                            type="button"
                            title="Edit invoice"
                            onClick={() =>
                              navigate(`/invoices/${invoice._id}/edit`)
                            }
                            className="rounded-md p-2 text-text-secondary hover:bg-amber-50 hover:text-warning"
                          >
                            <Pencil size={17} />
                          </button>
                        )}

                        <button
                          type="button"
                          title="Download PDF"
                          disabled={downloadingId === invoice._id}
                          onClick={() => handleDownload(invoice)}
                          className="rounded-md p-2 text-text-secondary hover:bg-blue-50 hover:text-info disabled:opacity-50"
                        >
                          <Download size={17} />
                        </button>

                        {isAdmin && invoice.status !== "Paid" && (
                          <button
                            type="button"
                            title="Delete invoice"
                            disabled={deletingId === invoice._id}
                            onClick={() => handleDelete(invoice)}
                            className="rounded-md p-2 text-text-secondary hover:bg-red-50 hover:text-danger disabled:opacity-50"
                          >
                            <Trash2 size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-secondary">
            {pagination.total
              ? `Showing ${invoices.length} invoices · ${pagination.total} total`
              : `${invoices.length} invoices`}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="min-w-20 text-center text-sm text-text-secondary">
              Page {page} of {Math.max(1, pagination.totalPages)}
            </span>
            <button
              type="button"
              disabled={page >= pagination.totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
