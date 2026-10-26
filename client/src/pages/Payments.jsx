import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  Building,
  ArrowRight,
  RefreshCw,
  X,
  FileText,
} from "lucide-react";
import api from "../api/api";
import { getInvoices } from "../api/invoiceApi";

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

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [paymentForm, setPaymentForm] = useState({
    invoiceId: "",
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Bank Transfer",
    reference: "",
    notes: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, invRes] = await Promise.allSettled([
        api.get("/payments"),
        getInvoices({ limit: 100 }),
      ]);

      if (payRes.status === "fulfilled") {
        const raw = payRes.value?.data?.data ?? payRes.value?.data ?? [];
        setPayments(raw.payments ?? (Array.isArray(raw) ? raw : []));
      }

      if (invRes.status === "fulfilled") {
        const raw = invRes.value?.data?.data ?? invRes.value?.data ?? [];
        setInvoices(raw.invoices ?? (Array.isArray(raw) ? raw : []));
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalCollected = payments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );

  const selectedInvoice = invoices.find((i) => i._id === paymentForm.invoiceId);
  const outstandingOnSelected = selectedInvoice
    ? Math.max(0, (Number(selectedInvoice.total) || 0) - (Number(selectedInvoice.paidAmount) || 0))
    : 0;

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.invoiceId || !paymentForm.amount) {
      setError("Please select an invoice and enter amount");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      await api.post("/payments", {
        invoiceId: paymentForm.invoiceId,
        amount: Number(paymentForm.amount),
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        reference: paymentForm.reference,
        notes: paymentForm.notes,
      });

      setSuccessMsg("Payment recorded successfully!");
      setModalOpen(false);
      setPaymentForm({
        invoiceId: "",
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMethod: "Bank Transfer",
        reference: "",
        notes: "",
      });
      fetchData();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to record payment"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered payments
  const filteredPayments = payments.filter((p) => {
    const invNum =
      p.invoice?.invoiceNumber || p.invoiceNumber || p.reference || "";
    const matchesSearch =
      invNum.toLowerCase().includes(search.toLowerCase()) ||
      String(p.paymentMethod || "")
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesMethod =
      methodFilter === "All" || p.paymentMethod === methodFilter;
    return matchesSearch && matchesMethod;
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Payment Receipts
          </h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Track client payment collections, bank settlements, and receipt
            records.
          </p>
        </div>

        <button
          onClick={() => {
            setError("");
            setModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-text-inverse shadow-xs transition hover:bg-primary-hover"
        >
          <Plus size={16} />
          Record Payment
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600" />
          {successMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <p className="text-xs font-medium text-text-secondary">
            Total Payments Logged
          </p>
          <p className="mt-2 text-2xl font-black text-emerald-600">
            {formatCurrency(totalCollected)}
          </p>
          <p className="mt-2 text-xs text-text-secondary">
            {payments.length} successful transactions
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <p className="text-xs font-medium text-text-secondary">
            Primary Settlement Account
          </p>
          <p className="mt-2 text-sm font-bold text-text-primary">
            HDFC Bank (A/C: 50200092611852)
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            IFSC: HDFC0000968 | Gachibowli
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <p className="text-xs font-medium text-text-secondary">
            UPI / Instant Payment
          </p>
          <p className="mt-2 text-sm font-bold text-text-primary">
            PhonePe / GPay: +91 63004 40316
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Ultrakey IT Solutions Pvt. Ltd.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs">
          <Search size={16} className="text-text-secondary shrink-0" />
          <input
            type="text"
            placeholder="Search by invoice number, reference, or method..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none placeholder:text-text-secondary"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-text-secondary shrink-0">
            Method:
          </label>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-text-primary focus:outline-none"
          >
            <option value="All">All Methods</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="UPI">UPI / GPay / PhonePe</option>
            <option value="Razorpay">Razorpay</option>
            <option value="Cash">Cash</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {filteredPayments.length === 0 ? (
            <div className="py-16 text-center text-xs text-text-secondary">
              No payment transactions found. Click "Record Payment" to log one.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 text-text-secondary font-semibold border-b border-border">
                <tr>
                  <th className="py-3 px-4">Receipt Date</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Reference / Trans ID</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPayments.map((p) => {
                  const invNumber =
                    p.invoice?.invoiceNumber ||
                    p.invoiceNumber ||
                    p.invoice?._id?.slice(-6) ||
                    "—";
                  return (
                    <tr
                      key={p._id}
                      className="transition-colors hover:bg-slate-50/50"
                    >
                      <td className="py-3.5 px-4 font-medium text-text-primary">
                        {formatDate(p.paymentDate || p.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-primary">
                        {p.invoice?._id ? (
                          <Link
                            to={`/invoices/${p.invoice._id}`}
                            className="hover:underline flex items-center gap-1"
                          >
                            <FileText size={13} />
                            {invNumber}
                          </Link>
                        ) : (
                          invNumber
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-text-primary">
                        {p.paymentMethod || "Bank Transfer"}
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary font-mono">
                        {p.reference || p.notes || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-600">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} />
                          Settled
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Bottom Right Pagination */}
        <div className="flex flex-col gap-2 border-t border-border px-5 py-3 sm:flex-row sm:items-center sm:justify-between text-xs text-text-secondary">
          <span>Showing {filteredPayments.length} payment records</span>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              disabled
              className="rounded-lg border border-border px-2.5 py-1 text-xs opacity-50 cursor-not-allowed"
            >
              Previous
            </button>
            <span className="font-semibold text-primary">Page 1 of 1</span>
            <button
              disabled
              className="rounded-lg border border-border px-2.5 py-1 text-xs opacity-50 cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Record New Payment
                </h3>
                <p className="text-xs text-text-secondary">
                  Apply a receipt against an existing invoice.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-text-secondary hover:bg-slate-100 hover:text-text-primary"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                {error}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-text-primary">
                  Select Invoice *
                </label>
                <select
                  required
                  value={paymentForm.invoiceId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const inv = invoices.find((i) => i._id === id);
                    const bal = inv
                      ? Math.max(0, (Number(inv.total) || 0) - (Number(inv.paidAmount) || 0))
                      : "";
                    setPaymentForm({
                      ...paymentForm,
                      invoiceId: id,
                      amount: bal ? String(bal) : "",
                    });
                  }}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                >
                  <option value="">-- Choose Invoice to apply payment --</option>
                  {invoices.map((inv) => {
                    const client =
                      inv.clientId?.clientName ||
                      inv.clientId?.name ||
                      inv.clientName ||
                      "Client";
                    const bal = Math.max(
                      0,
                      (Number(inv.total) || 0) - (Number(inv.paidAmount) || 0)
                    );
                    return (
                      <option key={inv._id} value={inv._id}>
                        {inv.invoiceNumber || inv._id?.slice(-6)} - {client} (Due: ₹{bal})
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedInvoice && (
                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-3 text-xs">
                  <p className="font-bold text-primary">Invoice Details</p>
                  <div className="mt-1 flex justify-between text-[11px] text-text-secondary">
                    <span>Total Billed: ₹{selectedInvoice.total}</span>
                    <span>Already Paid: ₹{selectedInvoice.paidAmount || 0}</span>
                    <span className="font-bold text-amber-700">
                      Balance Due: ₹{outstandingOnSelected}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    max={outstandingOnSelected || undefined}
                    placeholder="e.g. 5000"
                    value={paymentForm.amount}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, amount: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        paymentDate: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Payment Method *
                  </label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        paymentMethod: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Razorpay">Razorpay Online</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Reference / Transaction ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR / UPI Ref / Cheque #"
                    value={paymentForm.reference}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        reference: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-text-primary">
                  Notes / Remarks
                </label>
                <input
                  type="text"
                  placeholder="Optional memo"
                  value={paymentForm.notes}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, notes: e.target.value })
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Confirm & Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
