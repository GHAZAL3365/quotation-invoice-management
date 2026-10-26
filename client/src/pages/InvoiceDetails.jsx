import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Pencil,
  Printer,
  CreditCard,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  downloadInvoicePdf,
  getInvoiceById,
  getInvoicePayments,
  recordInvoicePayment,
} from "../api/invoiceApi";

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? {};
}

function getInvoice(result) {
  return result?.invoice ?? result?.data?.invoice ?? result;
}

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function date(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

export default function InvoiceDetails() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { id } = useParams();

  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [paymentRef, setPaymentRef] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const loadDetails = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getInvoiceById(id);
      const result = unwrap(response);
      const invoiceData = getInvoice(result);

      if (!invoiceData?._id) {
        throw new Error("Invoice details were not returned by the server.");
      }

      setInvoice(invoiceData);

      if (isAdmin) {
        try {
          const paymentResponse = await getInvoicePayments(id, {
            page: 1,
            limit: 100,
          });
          const paymentResult = unwrap(paymentResponse);
          const rows = Array.isArray(paymentResult)
            ? paymentResult
            : paymentResult?.payments ?? [];
          setPayments(rows);
        } catch {
          setPayments([]);
        }
      } else {
        setPayments([]);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to load invoice"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id, isAdmin]);

  const handleDownload = async () => {
    setDownloading(true);
    setError("");
    try {
      const response = await downloadInvoicePdf(id);
      const url = URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${invoice.invoiceNumber || "invoice"}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.response?.data?.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount) return;
    setSubmittingPayment(true);
    try {
      await recordInvoicePayment(id, {
        amount: Number(paymentAmount),
        paymentMethod,
        reference: paymentRef,
        paymentDate: new Date().toISOString(),
      });
      setPaymentModalOpen(false);
      setPaymentAmount("");
      setPaymentRef("");
      loadDetails();
    } catch (err) {
      setError(err?.response?.data?.message || "Payment recording failed");
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-12 text-center text-sm text-text-secondary">
        Loading invoice details...
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="space-y-4">
        <Link
          to="/invoices"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft size={16} /> Back to invoices
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  const client =
    (invoice.clientId ?? invoice.client) &&
    typeof (invoice.clientId ?? invoice.client) === "object"
      ? invoice.clientId ?? invoice.client
      : null;

  const clientName =
    client?.clientName ?? invoice.clientName ?? "Client";

  const paid = Number(invoice.paidAmount ?? 0);
  const total = Number(invoice.total ?? 0);
  const balance = Math.max(0, total - paid);
  const isPaid = String(invoice.status).toLowerCase() === "paid";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top action bar (hidden during print) */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center print:hidden">
        <div className="flex items-center gap-3">
          <Link
            to="/invoices"
            className="rounded-xl border border-border bg-surface p-2.5 text-text-secondary hover:bg-slate-100"
            title="Back to Invoices"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Invoice {invoice.invoiceNumber || invoice._id?.slice(-6)}
            </h1>
            <p className="text-xs text-text-secondary">
              Created on {date(invoice.invoiceDate)} · Due {date(invoice.dueDate)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && !isPaid && (
            <button
              onClick={() => {
                setPaymentAmount(String(balance));
                setPaymentModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
            >
              <CreditCard size={15} />
              Record Payment
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

          {isAdmin && !isPaid && (
            <Link
              to={`/invoices/${id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-primary hover:bg-slate-50 transition"
            >
              <Pencil size={15} />
              Edit
            </Link>
          )}
        </div>
      </div>

      {/* Printable Invoice Sheet (Matched to PDF Pages 10 & 11) */}
      <div className="relative rounded-2xl border border-slate-200 bg-white p-8 shadow-md sm:p-12 print:border-none print:shadow-none print:p-0">
        {/* Paid Watermark */}
        {isPaid && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
            <span className="rotate-[-25deg] select-none text-7xl sm:text-9xl font-black uppercase tracking-widest text-emerald-500/15 border-8 border-emerald-500/20 px-8 py-4 rounded-3xl">
              PAID
            </span>
          </div>
        )}

        {/* Top Band */}
        <div className="h-3 w-full rounded-t-lg bg-[#203B5B] -mt-8 -mx-8 sm:-mt-12 sm:-mx-12 mb-8 print:mt-0 print:mx-0" />

        {/* Header: Company & Invoice Label */}
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
              INVOICE
            </span>
            <p className="pt-2 text-sm font-bold text-slate-800">
              Invoice #: {invoice.invoiceNumber || invoice._id?.slice(-6)}
            </p>
            <p className="text-xs text-slate-500">
              Date: <span className="font-semibold text-slate-700">{date(invoice.invoiceDate)}</span>
            </p>
            <p className="text-xs text-slate-500">
              Due Date: <span className="font-semibold text-slate-700">{date(invoice.dueDate)}</span>
            </p>
            <div className="mt-2 inline-block rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs text-left">
              <span className="text-[10px] uppercase font-bold text-[#597B9B] block">
                Total Due
              </span>
              <span className="text-sm font-black text-[#203B5B]">
                {money(balance)}
              </span>
            </div>
          </div>
        </div>

        {/* Bill To & Details Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 py-6">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#597B9B]">
              Billed To
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
              Payment Status & Schedule
            </p>
            <div className="mt-2 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Status:</span>
                <span className="font-bold">{invoice.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Terms:</span>
                <span className="font-medium">14 Days from issuance</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Settlement Status:</span>
                <span className={isPaid ? "font-bold text-emerald-600" : "font-bold text-amber-600"}>
                  {isPaid ? "Fully Settled" : `Pending (${money(balance)})`}
                </span>
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
                <th className="py-3 px-4">Service Details / Description</th>
                <th className="py-3 px-4 text-right w-20">Qty</th>
                <th className="py-3 px-4 text-right w-28">Rate/Price</th>
                <th className="py-3 px-4 text-right w-28">Sub Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(invoice.items || []).map((item, idx) => {
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

        {/* Calculation & Payment Methods Breakdown */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-12 pt-6">
          {/* Left: Payment Options callout card from PDF page 11 */}
          <div className="sm:col-span-7 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs space-y-2">
            <p className="font-bold text-[#203B5B] uppercase text-[11px] tracking-wider">
              Pay Invoice Amount via one of the options below:
            </p>
            <div className="rounded-lg bg-white p-2.5 border border-slate-200">
              <p className="font-bold text-slate-700">Option 1: UPI / GPay / PhonePe</p>
              <p className="text-slate-600 mt-0.5">Mobile Number: <span className="font-mono font-bold text-primary">+91 63004 40316</span></p>
            </div>
            <div className="rounded-lg bg-white p-2.5 border border-slate-200">
              <p className="font-bold text-slate-700">Option 2: Direct Bank Transfer</p>
              <p className="text-slate-600 mt-0.5 font-mono">A/C: 50200092611852</p>
              <p className="text-slate-600 font-mono">Name: Ultrakey IT Solutions Pvt. Ltd.</p>
              <p className="text-slate-600 font-mono">IFSC: HDFC0000968 | Branch: GACHIBOWLI</p>
            </div>
          </div>

          {/* Right: Calculations */}
          <div className="sm:col-span-5 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Sub Total</span>
              <span className="font-semibold text-slate-800 font-mono">{money(invoice.subtotal)}</span>
            </div>
            {Number(invoice.discount) > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100 text-rose-600">
                <span>Discount</span>
                <span className="font-semibold font-mono">-{money(invoice.discount)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">GST (18%)</span>
              <span className="font-semibold text-slate-800 font-mono">{money(invoice.taxAmount)}</span>
            </div>
            {paid > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-600">
                <span>Paid</span>
                <span className="font-semibold font-mono">-{money(paid)}</span>
              </div>
            )}
            <div className="flex justify-between items-center bg-[#203B5B] text-white p-3 rounded-xl font-bold mt-2">
              <span className="uppercase text-xs tracking-wider">Total Due</span>
              <span className="text-base font-black font-mono">{money(balance)}</span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="mt-8 border-t border-slate-200 pt-5 text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-700">Notes & Payment Terms:</p>
          <p>
            Payment is due within 14 days from date of invoice. Late payment is
            subject to fees of 5% per month.
          </p>
          <p className="text-[11px] text-slate-500">
            • 60% Advance Payment for Commencement · Remaining 40% Final Settlement
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-slate-100 pt-4 text-center text-[11px] text-slate-400">
          Thanks for choosing Ultrakey IT Solutions Pvt. Ltd. | support@ultrakeyit.com | +91 63004 40316
        </div>
      </div>

      {/* Payment Recording Modal */}
      {isAdmin && paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-text-primary">
                Record Payment for {invoice.invoiceNumber}
              </h3>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={balance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                >
                  <option value="Bank Transfer">Bank Transfer (HDFC)</option>
                  <option value="UPI">UPI / PhonePe / GPay</option>
                  <option value="Razorpay">Razorpay Online</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Reference / UTR / Transaction ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI-12345678"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  {submittingPayment ? "Saving..." : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
