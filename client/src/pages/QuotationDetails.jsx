import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Pencil,
  Printer,
  CheckCircle2,
  FileText,
  Clock,
  XCircle,
  Building2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import quotationService from "../api/quotationApi";
import { createInvoice } from "../api/invoiceApi";
import { useAuth } from "../context/AuthContext";

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response ?? {};
}

function getQuotation(result) {
  return result?.quotation ?? result?.data?.quotation ?? result;
}

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function QuotationDetails() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { id } = useParams();
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [converting, setConverting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const loadQuotation = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await quotationService.getQuotationById(id);
      const result = unwrap(response);
      const data = getQuotation(result);

      if (!data?._id) {
        throw new Error("Quotation details were not returned by the server.");
      }
      setQuotation(data);
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to load quotation"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotation();
  }, [id]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await quotationService.downloadQuotationPdf(id);
    } catch (err) {
      setError("Download failed. Please try printing directly.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleConvertToInvoice = async () => {
    if (!quotation) return;
    setConverting(true);
    setError("");

    try {
      // 1. Mark quotation as Accepted if not already
      try {
        await quotationService.updateQuotation(id, { status: "Accepted" });
      } catch (e) {
        // Continue to create invoice even if status update warning occurs
      }

      // 2. Create invoice from quotation items and client
      const clientId =
        quotation.clientId?._id || quotation.clientId || quotation.client?._id;

      const invoicePayload = {
        clientId,
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 14 * 86400000)
          .toISOString()
          .split("T")[0],
        items: quotation.items.map((it) => ({
          description: it.description,
          quantity: Number(it.quantity) || 1,
          rate: Number(it.rate) || 0,
        })),
        discount: Number(quotation.discount) || 0,
        taxRate: Number(quotation.taxRate) || 18,
        notes: `Generated from Quotation ${quotation.quotationNumber}. ${
          quotation.notes || ""
        }`,
      };

      const invRes = await createInvoice(invoicePayload);
      const raw = invRes?.data?.data ?? invRes?.data ?? {};
      const newInvoiceId = raw.invoice?._id || raw._id;

      if (newInvoiceId) {
        navigate(`/invoices/${newInvoiceId}`);
      } else {
        navigate("/invoices");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to convert quotation into invoice"
      );
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-12 text-center text-sm text-text-secondary">
        Loading quotation details...
      </div>
    );
  }

  if (error && !quotation) {
    return (
      <div className="space-y-4">
        <Link
          to="/quotations"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft size={16} /> Back to quotations
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!quotation) return null;

  const client =
    quotation.clientId && typeof quotation.clientId === "object"
      ? quotation.clientId
      : null;

  const clientName =
    client?.clientName || quotation.clientName || "Client";

  const isAccepted = String(quotation.status).toLowerCase() === "accepted";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top action bar (hidden during print) */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center print:hidden">
        <div className="flex items-center gap-3">
          <Link
            to="/quotations"
            className="rounded-xl border border-border bg-surface p-2.5 text-text-secondary hover:bg-slate-100"
            title="Back to Quotations"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Quotation {quotation.quotationNumber || quotation._id?.slice(-6)}
            </h1>
            <p className="text-xs text-text-secondary">
              Quoted on {formatDate(quotation.quotationDate)} · Valid until{" "}
              {formatDate(quotation.validUntil)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Accept and Convert button from PDF requirement */}
          {isAdmin && (
            <button
              type="button"
              onClick={handleConvertToInvoice}
              disabled={converting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              <CheckCircle2 size={15} />
              {converting ? "Converting..." : "Accept & Convert to Invoice"}
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-slate-50 transition"
          >
            <Printer size={15} />
            Print
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-50 transition"
          >
            <Download size={15} />
            {downloading ? "Preparing..." : "Download PDF"}
          </button>

          {isAdmin && (
            <Link
              to={`/quotations/${id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-primary hover:bg-slate-50 transition"
            >
              <Pencil size={15} />
              Edit
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Printable Quotation Sheet */}
      <div className="relative rounded-2xl border border-slate-200 bg-white p-8 shadow-md sm:p-12 print:border-none print:shadow-none print:p-0">
        {/* Accepted Watermark */}
        {isAccepted && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
            <span className="rotate-[-25deg] select-none text-7xl sm:text-9xl font-black uppercase tracking-widest text-emerald-500/15 border-8 border-emerald-500/20 px-8 py-4 rounded-3xl">
              ACCEPTED
            </span>
          </div>
        )}

        {/* Top Band */}
        <div className="h-3 w-full rounded-t-lg bg-[#203B5B] -mt-8 -mx-8 sm:-mt-12 sm:-mx-12 mb-8 print:mt-0 print:mx-0" />

        {/* Header */}
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#203B5B] text-white font-bold text-lg">
                U
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[#203B5B]">
                Ultrakey IT Solutions Private Limited
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-sm pt-1">
              Flat No. 204, 2nd Floor, Cyber Residency, Indira Nagar, Gachibowli,
              Hyderabad, Telangana, India-500032
            </p>
            <p className="text-xs text-slate-500">
              support@ultrakeyit.com | +91 63004 40316
            </p>
            <p className="text-xs font-semibold text-[#203B5B]">
              GST No: 36AADCU5062A1Z0
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="inline-block rounded-lg bg-[#203B5B] px-4 py-1 text-sm font-black tracking-widest text-white uppercase">
              QUOTATION
            </span>
            <p className="pt-2 text-sm font-bold text-slate-800">
              Quote #: {quotation.quotationNumber || quotation._id?.slice(-6)}
            </p>
            <p className="text-xs text-slate-500">
              Date: <span className="font-semibold text-slate-700">{formatDate(quotation.quotationDate)}</span>
            </p>
            <p className="text-xs text-slate-500">
              Valid Until: <span className="font-semibold text-slate-700">{formatDate(quotation.validUntil)}</span>
            </p>
            <div className="mt-2 inline-block rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs text-left">
              <span className="text-[10px] uppercase font-bold text-[#597B9B] block">
                Quote Total
              </span>
              <span className="text-sm font-black text-[#203B5B]">
                {money(quotation.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Client & Quotation Details Panels */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 py-6">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#597B9B]">
              Quotation For
            </p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              {clientName}
            </p>
            {client?.billingAddress && (
              <p className="mt-1 text-xs text-slate-600 whitespace-pre-line">
                {client.billingAddress}
              </p>
            )}
            {client?.email && (
              <p className="mt-1 text-xs text-slate-500">{client.email}</p>
            )}
            {client?.phone && (
              <p className="text-xs text-slate-500">{client.phone}</p>
            )}
            {client?.taxId && (
              <p className="mt-1 text-xs font-semibold text-slate-700">
                Tax ID: {client.taxId}
              </p>
            )}
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#597B9B]">
              Proposal Parameters
            </p>
            <div className="mt-2 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Quotation Status:</span>
                <span className="font-bold">{quotation.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Validity:</span>
                <span className="font-medium">Valid until date indicated above</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Action on acceptance:</span>
                <span className="font-medium text-primary">Converts to official invoice</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#203B5B] text-white uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Description / Scope of Work</th>
                <th className="py-3 px-4 text-right w-20">Qty</th>
                <th className="py-3 px-4 text-right w-28">Rate (₹)</th>
                <th className="py-3 px-4 text-right w-28">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(quotation.items || []).map((item, idx) => {
                const itemTotal =
                  item.amount ??
                  Number(item.quantity || 1) * Number(item.rate || 0);
                return (
                  <tr
                    key={idx}
                    className={idx % 2 === 1 ? "bg-slate-50/60" : "bg-white"}
                  >
                    <td className="py-3.5 px-4 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {item.description}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-600">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-600 font-mono">
                      {money(item.rate)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-800 font-mono">
                      {money(itemTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="flex justify-end pt-6">
          <div className="w-full max-w-sm space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Sub Total</span>
              <span className="font-semibold text-slate-800 font-mono">
                {money(quotation.subtotal)}
              </span>
            </div>
            {Number(quotation.discount) > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100 text-rose-600">
                <span>Discount</span>
                <span className="font-semibold font-mono">
                  -{money(quotation.discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Tax ({Number(quotation.taxRate)}%)</span>
              <span className="font-semibold text-slate-800 font-mono">
                {money(quotation.taxAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center bg-[#203B5B] text-white p-3 rounded-xl font-bold mt-2">
              <span className="uppercase text-xs tracking-wider">Total</span>
              <span className="text-base font-black font-mono">
                {money(quotation.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes & Terms from PDF page 3 */}
        <div className="mt-8 border-t border-slate-200 pt-5 text-xs text-slate-600 space-y-2">
          <p className="font-bold text-slate-700">Notes & Terms:</p>
          <p>
            {quotation.notes ||
              "This is a fixed price quote. If accepted, we require a 60% deposit upfront before work commences."}
          </p>
          <div className="rounded-lg bg-blue-50/70 p-3 text-[11px] text-blue-900 border border-blue-100">
            <strong>Please Note:</strong> After accepting this Quote an Invoice
            will be automatically generated. This will then become a legally
            binding contract.
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-slate-100 pt-4 text-center text-[11px] text-slate-400">
          Ultrakey IT Solutions Private Limited | support@ultrakeyit.com | www.ultrakeyit.com | +91 63004 40316
        </div>
      </div>
    </div>
  );
}
