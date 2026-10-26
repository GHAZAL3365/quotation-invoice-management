
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

import { getClients } from "../api/clientApi";
import quotationService from "../api/quotationApi";
const today = () => new Date().toISOString().split("T")[0];

const emptyItem = () => ({
  description: "",
  quantity: "1",
  rate: "0",
});

const initialForm = () => ({
  clientId: "",
  quotationDate: today(),
  validUntil: today(),
  discount: "0",
  taxRate: "18",
  notes: "",
  items: [emptyItem()],
});

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response ?? {};
}

function getMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.message ||
    error?.message ||
    fallback
  );
}

function getClientRows(result) {
  if (Array.isArray(result)) return result;

  return (
    result?.clients ??
    result?.items ??
    result?.results ??
    result?.data?.clients ??
    result?.data?.items ??
    result?.data?.results ??
    []
  );
}

function getQuotation(result) {
  return result?.quotation ?? result?.data?.quotation ?? result;
}

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

const labelClass = "mb-1.5 block text-sm font-medium text-text-primary";

const sectionClass =
  "rounded-xl border border-border bg-surface p-5";

export default function QuotationForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEditing = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pageError, setPageError] = useState("");

  const subtotal = useMemo(() => {
    return form.items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;

      return sum + quantity * rate;
    }, 0);
  }, [form.items]);

  const discountAmount = useMemo(() => {
    const discount = Math.max(0, Number(form.discount) || 0);
    return Math.min(discount, subtotal);
  }, [form.discount, subtotal]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  const taxAmount = useMemo(() => {
    const taxRate = Math.max(0, Number(form.taxRate) || 0);

    return (taxableAmount * taxRate) / 100;
  }, [taxableAmount, form.taxRate]);

  const total = taxableAmount + taxAmount;

  useEffect(() => {
    let active = true;

    async function loadFormData() {
      setLoading(true);
      setPageError("");

      try {
        const clientResponse = await getClients({
          page: 1,
          limit: 100,
        });

        const clientResult = unwrap(clientResponse);
        const clientRows = getClientRows(clientResult);

        if (active) {
          setClients(clientRows);
        }

        if (isEditing) {
          const quotationResponse = await quotationService.getQuotationById(id);
          const quotationResult = unwrap(quotationResponse);
          const quotation = getQuotation(quotationResult);

          if (!quotation || !quotation._id) {
            throw new Error("Quotation details could not be loaded.");
          }

          if (active) {
            const clientValue =
              quotation.clientId?._id ??
              quotation.clientId ??
              quotation.client?._id ??
              quotation.client ??
              "";

            setForm({
              clientId: String(clientValue),
              quotationDate: quotation.quotationDate
                ? String(quotation.quotationDate).slice(0, 10)
                : today(),
              validUntil: quotation.validUntil
                ? String(quotation.validUntil).slice(0, 10)
                : today(),
              discount: String(quotation.discount ?? 0),
              taxRate: String(quotation.taxRate ?? 0),
              notes: quotation.notes ?? "",
              items:
                Array.isArray(quotation.items) &&
                quotation.items.length > 0
                  ? quotation.items.map((item) => ({
                      description: item.description ?? "",
                      quantity: String(item.quantity ?? 1),
                      rate: String(item.rate ?? 0),
                    }))
                  : [emptyItem()],
            });
          }
        }
      } catch (err) {
        if (active) {
          setPageError(
            getMessage(err, "Unable to load quotation form data.")
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadFormData();

    return () => {
      active = false;
    };
  }, [id, isEditing]);

  function handleFieldChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  function handleItemChange(index, field, value) {
    setForm((previous) => ({
      ...previous,
      items: previous.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }));

    setError("");
  }

  function addItem() {
    setForm((previous) => ({
      ...previous,
      items: [...previous.items, emptyItem()],
    }));
  }

  function removeItem(index) {
    setForm((previous) => ({
      ...previous,
      items:
        previous.items.length === 1
          ? [emptyItem()]
          : previous.items.filter((_, itemIndex) => itemIndex !== index),
    }));

    setError("");
  }

  function validateForm() {
    if (!form.clientId) {
      return "Please select a client.";
    }

    if (!form.quotationDate || !form.validUntil) {
      return "Please select the quotation date and validity date.";
    }

    if (form.validUntil < form.quotationDate) {
      return "Validity date cannot be earlier than the quotation date.";
    }

    if (!form.items.length) {
      return "Please add at least one item.";
    }

    for (let index = 0; index < form.items.length; index += 1) {
      const item = form.items[index];
      const itemNumber = index + 1;

      if (!item.description.trim()) {
        return `Please enter a description for item ${itemNumber}.`;
      }

      if (item.description.trim().length > 500) {
        return `Item ${itemNumber} description cannot exceed 500 characters.`;
      }

      if (
        item.quantity === "" ||
        !Number.isFinite(Number(item.quantity)) ||
        Number(item.quantity) <= 0
      ) {
        return `Please enter a valid quantity for item ${itemNumber}.`;
      }

      if (
        item.rate === "" ||
        !Number.isFinite(Number(item.rate)) ||
        Number(item.rate) < 0
      ) {
        return `Please enter a valid rate for item ${itemNumber}.`;
      }
    }

    if (
      form.discount === "" ||
      !Number.isFinite(Number(form.discount)) ||
      Number(form.discount) < 0
    ) {
      return "Please enter a valid discount.";
    }

    if (Number(form.discount) > subtotal) {
      return "Discount cannot exceed the subtotal.";
    }

    if (
      form.taxRate === "" ||
      !Number.isFinite(Number(form.taxRate)) ||
      Number(form.taxRate) < 0 ||
      Number(form.taxRate) > 100
    ) {
      return "Tax rate must be between 0 and 100.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setPageError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      clientId: form.clientId,
      quotationDate: form.quotationDate,
      validUntil: form.validUntil,
      items: form.items.map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity),
        rate: Number(item.rate),
      })),
      discount: Number(form.discount),
      taxRate: Number(form.taxRate),
      notes: form.notes.trim(),
    };

    setSubmitting(true);

    try {
      if (isEditing) {
        await quotationService.updateQuotation(id, payload);
      } else {

        await quotationService.createQuotation(payload);
      }

      navigate("/quotations", {
        state: {
          message: isEditing
            ? "Quotation updated successfully."
            : "Quotation created successfully.",
        },
      });
    } catch (err) {
      setError(
        getMessage(
          err,
          isEditing
            ? "Failed to update quotation."
            : "Failed to create quotation."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p className="text-sm text-text-secondary">
          Loading quotation form...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/quotations"
            className="mb-3 inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-primary"
          >
            <ArrowLeft size={16} />
            Back to Quotations
          </Link>

          <h1 className="text-2xl font-semibold text-text-primary">
            {isEditing ? "Edit Quotation" : "Create Quotation"}
          </h1>

          <p className="mt-1 text-sm text-text-secondary">
            {isEditing
              ? "Update the quotation details and line items."
              : "Enter client details and add items to prepare a quotation."}
          </p>
        </div>
      </div>

      {pageError && (
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger"
        >
          {pageError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className={sectionClass}>
          <h2 className="mb-5 text-lg font-semibold text-text-primary">
            Quotation Details
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <label htmlFor="clientId" className={labelClass}>
                Client <span className="text-danger">*</span>
              </label>

              <select
                id="clientId"
                name="clientId"
                value={form.clientId}
                onChange={handleFieldChange}
                className={inputClass}
                required
              >
                <option value="">Select client</option>

                {clients.map((client) => (
                  <option
                    key={client._id}
                    value={client._id}
                  >
                    {client.name || client.clientName || client.companyName}
                    {client.email ? ` (${client.email})` : ""}
                  </option>
                ))}
              </select>

              {clients.length === 0 && (
                <p className="mt-1.5 text-xs text-text-secondary">
                  No clients found. Add a client before creating a quotation.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="quotationDate" className={labelClass}>
                Quotation Date <span className="text-danger">*</span>
              </label>

              <input
                id="quotationDate"
                name="quotationDate"
                type="date"
                value={form.quotationDate}
                onChange={handleFieldChange}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="validUntil" className={labelClass}>
                Valid Until <span className="text-danger">*</span>
              </label>

              <input
                id="validUntil"
                name="validUntil"
                type="date"
                min={form.quotationDate || undefined}
                value={form.validUntil}
                onChange={handleFieldChange}
                className={inputClass}
                required
              />
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Items
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Add the products or services included in this quotation.
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
                      ...current.items.filter((it) => it.description || Number(it.rate) > 0),
                      {
                        description: title,
                        quantity: String(qty || 1),
                        rate: String(rate || 0),
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
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-text-primary transition hover:bg-background"
              >
                <Plus size={15} />
                Add Item
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {form.items.map((item, index) => {
              const amount =
                (Number(item.quantity) || 0) *
                (Number(item.rate) || 0);

              return (
                <div
                  key={index}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-text-primary">
                      Item {index + 1}
                    </h3>

                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      aria-label={`Remove item ${index + 1}`}
                      title="Remove item"
                      className="rounded-lg p-2 text-danger transition hover:bg-danger/10"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                    <div className="md:col-span-6">
                      <label
                        htmlFor={`description-${index}`}
                        className={labelClass}
                      >
                        Description <span className="text-danger">*</span>
                      </label>

                      <input
                        id={`description-${index}`}
                        type="text"
                        maxLength={500}
                        value={item.description}
                        onChange={(event) =>
                          handleItemChange(
                            index,
                            "description",
                            event.target.value
                          )
                        }
                        placeholder="Enter item or service description"
                        className={inputClass}
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor={`quantity-${index}`}
                        className={labelClass}
                      >
                        Quantity <span className="text-danger">*</span>
                      </label>

                      <input
                        id={`quantity-${index}`}
                        type="number"
                        min="0.000001"
                        step="any"
                        value={item.quantity}
                        onChange={(event) =>
                          handleItemChange(
                            index,
                            "quantity",
                            event.target.value
                          )
                        }
                        className={inputClass}
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor={`rate-${index}`}
                        className={labelClass}
                      >
                        Rate (₹) <span className="text-danger">*</span>
                      </label>

                      <input
                        id={`rate-${index}`}
                        type="number"
                        min="0"
                        step="any"
                        value={item.rate}
                        onChange={(event) =>
                          handleItemChange(
                            index,
                            "rate",
                            event.target.value
                          )
                        }
                        className={inputClass}
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className={labelClass}>
                        Amount
                      </label>

                      <div className="flex min-h-[42px] items-center rounded-lg bg-background px-3 text-sm font-medium text-text-primary">
                        {money(amount)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="mb-5 text-lg font-semibold text-text-primary">
            Discount, Tax and Notes
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <label htmlFor="discount" className={labelClass}>
                Discount (₹)
              </label>

              <input
                id="discount"
                name="discount"
                type="number"
                min="0"
                step="any"
                value={form.discount}
                onChange={handleFieldChange}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="taxRate" className={labelClass}>
                Tax Rate (%)
              </label>

              <input
                id="taxRate"
                name="taxRate"
                type="number"
                min="0"
                max="100"
                step="any"
                value={form.taxRate}
                onChange={handleFieldChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Tax Amount
              </label>

              <div className="flex min-h-[42px] items-center rounded-lg bg-background px-3 text-sm font-medium text-text-primary">
                {money(taxAmount)}
              </div>
            </div>

            <div className="md:col-span-3">
              <label htmlFor="notes" className={labelClass}>
                Notes
              </label>

              <textarea
                id="notes"
                name="notes"
                rows={3}
                maxLength={2000}
                value={form.notes}
                onChange={handleFieldChange}
                placeholder="Add terms, conditions, or additional information"
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            Quotation Summary
          </h2>

          <div className="ml-auto max-w-md space-y-3">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-text-secondary">Subtotal</span>
              <span className="font-medium text-text-primary">
                {money(subtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-text-secondary">Discount</span>
              <span className="font-medium text-text-primary">
                - {money(discountAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-text-secondary">
                Taxable Amount
              </span>
              <span className="font-medium text-text-primary">
                {money(taxableAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-text-secondary">
                Tax ({Number(form.taxRate) || 0}%)
              </span>
              <span className="font-medium text-text-primary">
                {money(taxAmount)}
              </span>
            </div>

            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-base font-semibold text-text-primary">
                  Total
                </span>
                <span className="text-xl font-bold text-primary">
                  {money(total)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger"
          >
            {error}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/quotations")}
            disabled={submitting}
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-primary transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting || clients.length === 0}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
                ? "Update Quotation"
                : "Create Quotation"}
          </button>
        </div>
      </form>
    </div>
  );
}
