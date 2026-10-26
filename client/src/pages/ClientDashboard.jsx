import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, FileText, FileSpreadsheet, RefreshCw } from "lucide-react";
import { getInvoices } from "../api/invoiceApi";
import quotationService from "../api/quotationApi";
import { useAuth } from "../context/AuthContext";

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

function getInvoiceRows(response) {
  const result = response?.data?.data ?? response?.data ?? {};
  return result.invoices ?? (Array.isArray(result) ? result : []);
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDocuments = useCallback(async (refresh = false) => {
    if (refresh) {
      setLoading(true);
      setError("");
    }

    const [invoiceResult, quotationResult] = await Promise.allSettled([
      getInvoices({ limit: 100 }),
      quotationService.getQuotations({ limit: 100 }),
    ]);

    if (invoiceResult.status === "fulfilled") {
      setInvoices(getInvoiceRows(invoiceResult.value));
    }
    if (quotationResult.status === "fulfilled") {
      const result = quotationResult.value;
      setQuotations(result.quotations ?? (Array.isArray(result) ? result : []));
    }
    if (
      invoiceResult.status === "rejected" ||
      quotationResult.status === "rejected"
    ) {
      setError(
        "Some of your documents could not be loaded. Please try refreshing."
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadDocuments);
  }, [loadDocuments]);

  const invoiceTotal = invoices.reduce(
    (total, invoice) => total + Number(invoice.total ?? 0),
    0
  );
  const unpaidTotal = invoices.reduce(
    (total, invoice) =>
      total +
      Math.max(
        0,
        Number(invoice.total ?? 0) - Number(invoice.paidAmount ?? 0)
      ),
    0
  );
  const quotationTotal = quotations.reduce(
    (total, quotation) => total + Number(quotation.total ?? 0),
    0
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="flex flex-col justify-between gap-4 rounded-2xl bg-linear-to-r from-[#203B5B] to-[#597B9B] p-6 text-white shadow-sm sm:flex-row sm:items-center sm:p-8">
        <div>
          <p className="text-sm font-medium text-blue-100">
            YOUR DOCUMENTS
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Welcome, {user?.name || "Client"}
          </h1>
          <p className="mt-2 text-sm text-blue-100">
            View your invoices and quotations in one place.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadDocuments(true)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/25 disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => loadDocuments(true)}
            className="shrink-0 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: "Your invoices",
            count: invoices.length,
            amount: formatCurrency(invoiceTotal),
            icon: FileText,
            href: "/invoices",
          },
          {
            title: "Outstanding balance",
            count: null,
            amount: formatCurrency(unpaidTotal),
            icon: FileText,
            href: "/invoices",
          },
          {
            title: "Your quotations",
            count: quotations.length,
            amount: formatCurrency(quotationTotal),
            icon: FileSpreadsheet,
            href: "/quotations",
          },
        ].map(({ title, count, amount, icon: Icon, href }) => (
          <Link
            key={title}
            to={href}
            className="rounded-xl border border-border bg-surface p-5 shadow-xs transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">
                  {title}
                </p>
                <p className="mt-2 text-2xl font-bold text-text-primary">
                  {amount}
                </p>
                {count !== null && (
                  <p className="mt-1 text-xs text-text-secondary">
                    {count} {title === "Your invoices" ? "invoices" : "quotations"}
                  </p>
                )}
              </div>
              <span className="rounded-lg bg-blue-50 p-3 text-primary">
                <Icon size={20} />
              </span>
            </div>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <DocumentList
          title="Recent invoices"
          loading={loading}
          documents={invoices.slice(0, 5)}
          href="/invoices"
          documentBasePath="/invoices"
          emptyMessage="Your invoices will appear here."
        />
        <DocumentList
          title="Recent quotations"
          loading={loading}
          documents={quotations.slice(0, 5)}
          href="/quotations"
          documentBasePath="/quotations"
          emptyMessage="Your quotations will appear here."
        />
      </section>
    </div>
  );
}

function DocumentList({
  title,
  loading,
  documents,
  href,
  documentBasePath,
  emptyMessage,
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="font-semibold text-text-primary">{title}</h2>
        <Link
          to={href}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View all <ArrowRight size={15} />
        </Link>
      </div>
      {loading ? (
        <p className="px-5 py-8 text-sm text-text-secondary">
          Loading your documents...
        </p>
      ) : documents.length === 0 ? (
        <p className="px-5 py-8 text-sm text-text-secondary">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-border">
          {documents.map((document) => {
            const number =
              document.invoiceNumber || document.quotationNumber || "Document";
            const dateValue = document.invoiceDate || document.quotationDate;
            return (
              <li key={document._id}>
                <Link
                  to={`${documentBasePath}/${document._id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-primary">
                      {number}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      {formatDate(dateValue)} · {document.status || "Draft"}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-text-primary">
                    {formatCurrency(document.total)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
