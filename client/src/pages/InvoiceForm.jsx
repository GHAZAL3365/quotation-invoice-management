
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";


import { getClients } from "../api/clientApi";
import {
  createInvoice,
  getInvoiceById,
  updateInvoice,
} from "../api/invoiceApi";

const today = () => new Date().toISOString().slice(0, 10);

const emptyItem = () => ({
  description: "",
  quantity: 1,
  rate: 0,
});

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? {};
}

function getMessage(error) {
  return (
    error?.response?.data?.message ??
    error?.response?.data?.error ??
    error?.message ??
    "Unable to save the invoice."
  );
}

function getClientRows(result) {
  if (Array.isArray(result)) return result;

  return (
    result?.clients ??
    result?.items ??
    result?.results ??
    result?.data?.clients ??
    []
  );
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

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 disabled:cursor-not-allowed disabled:bg-surface-muted";

const labelClass = "block text-sm font-medium text-text-primary";

export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    clientId: "",
    invoiceDate: today(),
    dueDate: "",
    discount: 0,
    taxRate: 18,
    notes: "",
    items: [emptyItem()],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadFormData() {
      setLoading(true);
      setError("");

      try {
        const clientsResponse = await getClients({
          page: 1,
          limit: 100,
        });

        const clientResult = unwrap(clientsResponse);
        const clientRows = getClientRows(clientResult).filter(
          (client) => client.isActive !== false && client.isDeleted !== true
        );

        if (!cancelled) setClients(clientRows);

        if (isEditing) {
          const invoiceResponse = await getInvoiceById(id);
          const invoice = getInvoice(unwrap(invoiceResponse));

          const invoiceClientId =
            typeof (invoice.clientId ?? invoice.client) === "object"
              ? (invoice.clientId ?? invoice.client)?._id
              : invoice.clientId ?? invoice.client;

          if (!cancelled) {
            setForm({
              clientId: invoiceClientId ?? "",
              invoiceDate: invoice.invoiceDate
                ? new Date(invoice.invoiceDate).toISOString().slice(0, 10)
                : today(),
              dueDate: invoice.dueDate
                ? new Date(invoice.dueDate).toISOString().slice(0, 10)
                : "",
              discount: Number(invoice.discount ?? 0),
              taxRate: Number(invoice.taxRate ?? 0),
              notes: invoice.notes ?? "",
              items:
                Array.isArray(invoice.items) && invoice.items.length
                  ? invoice.items.map((item) => ({
                      description: item.description ?? "",
                      quantity: Number(item.quantity ?? 1),
                      rate: Number(item.rate ?? 0),
                    }))
                  : [emptyItem()],
            });
          }
        }
      } catch (err) {
        if (!cancelled) setError(getMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFormData();

    return () => {
      cancelled = true;
    };
  }, [id, isEditing]);

  const subtotal = useMemo(
    () =>
      form.items.reduce(
        (sum, item) =>
          sum +
          Math.max(0, Number(item.quantity) || 0) *
            Math.max(0, Number(item.rate) || 0),
        0
      ),
    [form.items]
  );

  const discountAmount = Math.min(
    subtotal,
    Math.max(0, Number(form.discount) || 0)
  );

  const taxableAmount = subtotal - discountAmount;

  const taxAmount =
    taxableAmount * (Math.max(0, Number(form.taxRate) || 0) / 100);

  const total = taxableAmount + taxAmount;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateItem = (index, field, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addItem = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, emptyItem()],
    }));
  };

  const removeItem = (index) => {
    setForm((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? [emptyItem()]
          : current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.clientId) {
      setError("Please select a client.");
      return;
    }

    if (form.dueDate && form.dueDate < form.invoiceDate) {
      setError("Due date cannot be earlier than invoice date.");
      return;
    }

    if (!form.items.length) {
      setError("Add at least one invoice item.");
      return;
    }

    const invalidItem = form.items.some(
      (item) =>
        !item.description.trim() ||
        !Number.isFinite(Number(item.quantity)) ||
        Number(item.quantity) <= 0 ||
        !Number.isFinite(Number(item.rate)) ||
        Number(item.rate) < 0
    );

    if (invalidItem) {
      setError(
        "Each item needs a description, a quantity greater than zero, and a non-negative rate."
      );
      return;
    }

    const payload = {
      clientId: form.clientId,
      invoiceDate: form.invoiceDate,
      ...(form.dueDate ? { dueDate: form.dueDate } : {}),
      discount: Math.max(0, Number(form.discount) || 0),
      taxRate: Math.max(0, Number(form.taxRate) || 0),
      notes: form.notes.trim(),
      items: form.items.map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity),
        rate: Number(item.rate),
      })),
    };

    setSaving(true);

    try {
      if (isEditing) {
        await updateInvoice(id, payload);
      } else {
        await createInvoice(payload);
      }

      navigate("/invoices", {
        replace: true,
        state: {
          message: isEditing
            ? "Invoice updated successfully."
            : "Invoice created successfully.",
        },
      });
    } catch (err) {
      setError(getMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-10 text-center text-sm text-text-secondary">
        Loading invoice form...
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/invoices"
          className="rounded-lg border border-border p-2 text-text-secondary hover:bg-surface-muted"
          aria-label="Back to invoices"
        >
          <ArrowLeft size={18} />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {isEditing ? "Edit invoice" : "Create invoice"}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Add client details, line items, and payment terms.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-text-primary">
            Invoice information
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className={labelClass}>
              Client <span className="text-danger">*</span>
              <select
                required
                value={form.clientId}
                onChange={(event) =>
                  updateField("clientId", event.target.value)
                }
                className={inputClass}
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.clientName}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClass}>
              Invoice date <span className="text-danger">*</span>
              <input
                type="date"
                required
                value={form.invoiceDate}
                onChange={(event) =>
                  updateField("invoiceDate", event.target.value)
                }
                className={inputClass}
              />
            </label>

            <label className={labelClass}>
              Due date
              <input
                type="date"
                required
                min={form.invoiceDate}
                value={form.dueDate}
                onChange={(event) =>
                  updateField("dueDate", event.target.value)
                }
                className={inputClass}
              />
            </label>
          </div>

          {clients.length === 0 && (
            <p className="mt-3 text-sm text-warning">
              No active clients found. Add a client before creating an invoice.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                Invoice items
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Add each product or service as a separate line.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                onChange={(e) => {
                  if (!e.target.value) return;
                  const [qty, title, rate] = e.target.value.split("||");
                  setForm((current) => ({
                    ...current,
                    items: [
                      ...current.items.filter((it) => it.description || it.rate > 0),
                      {
                        description: title,
                        quantity: Number(qty) || 1,
                        rate: Number(rate) || 0,
                      },
                    ],
                  }));
                  e.target.value = "";
                }}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text-primary focus:border-primary focus:outline-none"
              >
                <option value="">+ Add a pre-defined line item...</option>
                <option value="1||.com/.in Domain Registration Charges per year||1600">
                  .com/.in Domain Registration (₹1,600)
                </option>
                <option value="1||Hosting Plan for 1 year||2500">
                  Hosting Plan for 1 year (₹2,500)
                </option>
                <option value="1||SSL Certificate for 1 Year||1200">
                  SSL Certificate for 1 Year (₹1,200)
                </option>
                <option value="1||Website Design & Development||25000">
                  Website Design & Development (₹25,000)
                </option>
                <option value="1||Employee Transfer from Ultrakey to Sainbiz One Time Service Fee||25000">
                  Employee Transfer Service Fee (₹25,000)
                </option>
                <option value="1||Hosting Plan Renewal for 1 Year||55000">
                  Hosting Plan Renewal (₹55,000)
                </option>
                <option value="1||Security Audit & Optimization||15000">
                  Security Audit & Optimization (₹15,000)
                </option>
              </select>

              <button
                type="button"
                onClick={addItem}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:bg-surface-muted"
              >
                <Plus size={15} />
                Add custom item
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {form.items.map((item, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-12"
              >
                <label className={`${labelClass} sm:col-span-6`}>
                  Description
                  <input
                    required
                    maxLength={250}
                    value={item.description}
                    onChange={(event) =>
                      updateItem(index, "description", event.target.value)
                    }
                    placeholder="Product or service description"
                    className={inputClass}
                  />
                </label>

                <label className={`${labelClass} sm:col-span-2`}>
                  Quantity
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="any"
                    value={item.quantity}
                    onChange={(event) =>
                      updateItem(index, "quantity", event.target.value)
                    }
                    className={inputClass}
                  />
                </label>

                <label className={`${labelClass} sm:col-span-2`}>
                  Rate (₹)
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.rate}
                    onChange={(event) =>
                      updateItem(index, "rate", event.target.value)
                    }
                    className={inputClass}
                  />
                </label>

                <div className="sm:col-span-2">
                  <span className={labelClass}>Amount</span>
                  <div className="mt-1 flex min-h-10 items-center justify-between gap-2 text-sm font-semibold text-text-primary">
                    {money(
                      (Number(item.quantity) || 0) *
                        (Number(item.rate) || 0)
                    )}
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      title="Remove item"
                      className="rounded-md p-1.5 text-danger hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-text-primary">
              Additional details
            </h2>

            <label className={labelClass}>
              Notes
              <textarea
                rows={5}
                maxLength={2000}
                value={form.notes}
                onChange={(event) =>
                  updateField("notes", event.target.value)
                }
                placeholder="Payment terms or other notes"
                className={inputClass}
              />
            </label>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-text-primary">
              Invoice summary
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-text-secondary">Subtotal</span>
                <span className="font-medium text-text-primary">
                  {money(subtotal)}
                </span>
              </div>

              <label className="flex items-center justify-between gap-4 text-sm">
                <span className="text-text-secondary">Discount (₹)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discount}
                  onChange={(event) =>
                    updateField("discount", event.target.value)
                  }
                  className="w-32 rounded-lg border border-border px-3 py-2 text-right text-sm outline-none focus:border-secondary"
                />
              </label>

              <label className="flex items-center justify-between gap-4 text-sm">
                <span className="text-text-secondary">Tax (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.taxRate}
                  onChange={(event) =>
                    updateField("taxRate", event.target.value)
                  }
                  className="w-32 rounded-lg border border-border px-3 py-2 text-right text-sm outline-none focus:border-secondary"
                />
              </label>

              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-text-secondary">Tax amount</span>
                <span className="font-medium text-text-primary">
                  {money(taxAmount)}
                </span>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-text-primary">
                    Estimated total
                  </span>
                  <span className="text-xl font-bold text-primary">
                    {money(total)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-text-secondary">
                  Preview only. The server calculates and validates the saved
                  invoice total.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Link
            to="/invoices"
            className="rounded-lg border border-border px-5 py-2.5 text-center text-sm font-semibold text-text-primary hover:bg-surface-muted"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving || clients.length === 0}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : isEditing
                ? "Save changes"
                : "Create invoice"}
          </button>
        </div>
      </form>
    </section>
  );
}
