

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

const today = new Date().toISOString().slice(0, 10);

const createEmptyItem = () => ({
  description: "",
  quantity: 1,
  rate: 0,
});

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

export default function QuotationForm({
  clients = [],
  onSubmit,
  submitting = false,
}) {
  const [form, setForm] = useState({
    clientId: "",
    quotationDate: today,
    validUntil: "",
    discount: "0",
    taxRate: "18",
    notes: "",
    items: [createEmptyItem()],
  });

  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const updateItem = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      ),
    }));

    setErrors((prev) => ({ ...prev, items: "" }));
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyItem()],
    }));
  };

  const removeItem = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const summary = useMemo(() => {
    const subtotal = form.items.reduce(
      (sum, item) =>
        sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0),
      0
    );

    const discount = Math.max(Number(form.discount) || 0, 0);
    const taxableAmount = Math.max(subtotal - discount, 0);
    const taxAmount =
      (taxableAmount * (Number(form.taxRate) || 0)) / 100;

    return {
      subtotal,
      discount,
      taxAmount,
      total: taxableAmount + taxAmount,
    };
  }, [form.items, form.discount, form.taxRate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!form.clientId) {
      nextErrors.clientId = "Please select a client.";
    }

    if (!form.quotationDate) {
      nextErrors.quotationDate = "Quotation date is required.";
    }

    if (!form.validUntil) {
      nextErrors.validUntil = "Validity date is required.";
    } else if (form.validUntil < form.quotationDate) {
      nextErrors.validUntil =
        "Validity date cannot be before quotation date.";
    }

    if (
      form.items.some(
        (item) =>
          !item.description.trim() ||
          item.description.trim().length > 500 ||
          !Number.isFinite(Number(item.quantity)) ||
          Number(item.quantity) <= 0 ||
          !Number.isFinite(Number(item.rate)) ||
          Number(item.rate) < 0
      )
    ) {
      nextErrors.items =
        "Enter a description, positive quantity, and valid rate for every item.";
    }

    if (
      !Number.isFinite(Number(form.discount)) ||
      Number(form.discount) < 0 ||
      Number(form.discount) > summary.subtotal
    ) {
      nextErrors.discount =
        "Discount must be between zero and the subtotal.";
    }

    if (
      !Number.isFinite(Number(form.taxRate)) ||
      Number(form.taxRate) < 0 ||
      Number(form.taxRate) > 100
    ) {
      nextErrors.taxRate = "Tax rate must be between 0 and 100.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    await onSubmit({
      clientId: form.clientId,
      quotationDate: form.quotationDate,
      validUntil: form.validUntil,
      discount: Number(form.discount),
      taxRate: Number(form.taxRate),
      notes: form.notes.trim(),
      items: form.items.map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity),
        rate: Number(item.rate),
      })),
    });
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

  const labelClass =
    "mb-1.5 block text-sm font-medium text-slate-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Quotation details */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-slate-900">
          Quotation Details
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div>
            <label htmlFor="clientId" className={labelClass}>
              Client <span className="text-red-500">*</span>
            </label>

            <select
              id="clientId"
              value={form.clientId}
              onChange={(e) => updateField("clientId", e.target.value)}
              className={inputClass}
              required
            >
              <option value="">Select a client</option>

              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.clientName || client.name || client.companyName}
                </option>
              ))}
            </select>

            {errors.clientId && (
              <p className="mt-1 text-xs text-red-600">
                {errors.clientId}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="quotationDate" className={labelClass}>
              Quotation Date <span className="text-red-500">*</span>
            </label>

            <input
              id="quotationDate"
              type="date"
              value={form.quotationDate}
              onChange={(e) =>
                updateField("quotationDate", e.target.value)
              }
              className={inputClass}
              required
            />

            {errors.quotationDate && (
              <p className="mt-1 text-xs text-red-600">
                {errors.quotationDate}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="validUntil" className={labelClass}>
              Valid Until <span className="text-red-500">*</span>
            </label>

            <input
              id="validUntil"
              type="date"
              min={form.quotationDate}
              value={form.validUntil}
              onChange={(e) =>
                updateField("validUntil", e.target.value)
              }
              className={inputClass}
              required
            />

            {errors.validUntil && (
              <p className="mt-1 text-xs text-red-600">
                {errors.validUntil}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Items */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Items and Services
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add the products or services included in this quotation.
            </p>
          </div>

          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            <Plus size={17} />
            Add Item
          </button>
        </div>

        <div className="space-y-4 p-5">
          {form.items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 items-end gap-4 rounded-lg border border-slate-200 p-4 md:grid-cols-12"
            >
              <div className="md:col-span-5">
                <label
                  htmlFor={`description-${index}`}
                  className={labelClass}
                >
                  Description
                </label>

                <input
                  id={`description-${index}`}
                  value={item.description}
                  onChange={(e) =>
                    updateItem(index, "description", e.target.value)
                  }
                  maxLength={500}
                  placeholder="Enter product or service"
                  className={inputClass}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor={`quantity-${index}`} className={labelClass}>
                  Quantity
                </label>

                <input
                  id={`quantity-${index}`}
                  type="number"
                  min="0.000001"
                  step="any"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, "quantity", e.target.value)
                  }
                  className={inputClass}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor={`rate-${index}`} className={labelClass}>
                  Rate (₹)
                </label>

                <input
                  id={`rate-${index}`}
                  type="number"
                  min="0"
                  step="any"
                  value={item.rate}
                  onChange={(e) =>
                    updateItem(index, "rate", e.target.value)
                  }
                  className={inputClass}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <p className={labelClass}>Amount</p>
                <p className="min-h-[42px] pt-2.5 text-sm font-semibold text-slate-900">
                  {currency(
                    (Number(item.quantity) || 0) *
                      (Number(item.rate) || 0)
                  )}
                </p>
              </div>

              <div className="flex md:col-span-1 md:justify-end">
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={form.items.length === 1}
                  aria-label={`Remove item ${index + 1}`}
                  title="Remove item"
                  className="rounded-lg p-2.5 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {errors.items && (
            <p className="text-sm text-red-600">{errors.items}</p>
          )}
        </div>
      </section>

      {/* Notes and totals */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Additional Notes
          </h2>

          <label htmlFor="notes" className="sr-only">
            Additional notes
          </label>

          <textarea
            id="notes"
            rows={5}
            maxLength={2000}
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Enter payment terms, delivery details, or other notes..."
            className={inputClass}
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">
            Summary
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-medium text-slate-900">
                {currency(summary.subtotal)}
              </span>
            </div>

            <div>
              <label htmlFor="discount" className={labelClass}>
                Discount (₹)
              </label>

              <input
                id="discount"
                type="number"
                min="0"
                max={summary.subtotal}
                step="any"
                value={form.discount}
                onChange={(e) => updateField("discount", e.target.value)}
                className={inputClass}
              />

              {errors.discount && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.discount}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="taxRate" className={labelClass}>
                Tax Rate (%)
              </label>

              <input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="any"
                value={form.taxRate}
                onChange={(e) => updateField("taxRate", e.target.value)}
                className={inputClass}
              />

              {errors.taxRate && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.taxRate}
                </p>
              )}
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Tax Amount</span>
              <span className="font-medium text-slate-900">
                {currency(summary.taxAmount)}
              </span>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-900">
                  Grand Total
                </span>
                <span className="text-xl font-bold text-blue-700">
                  {currency(summary.total)}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Final amounts are calculated and validated by the server.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => window.history.back()}
          disabled={submitting}
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving Quotation..." : "Save Quotation"}
        </button>
      </div>
    </form>
  );
}
