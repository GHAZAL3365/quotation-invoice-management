
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createClient, updateClient } from "../api/clientApi";

const emptyForm = {
  clientName: "",
  email: "",
  phone: "",
  billingAddress: "",
  taxId: "",
  notes: "",
};

const fields = [
  {
    name: "clientName",
    label: "Client Name",
    placeholder: "Enter client name",
    required: true,
  },
  {
    name: "email",
    label: "Email Address",
    placeholder: "client@example.com",
    type: "email",
    required: true,
  },
  {
    name: "phone",
    label: "Phone Number",
    placeholder: "Enter phone number",
  },
  {
    name: "taxId",
    label: "Tax ID / GSTIN",
    placeholder: "Enter tax identification number",
  },
];

export default function ClientFormModal({
  client = null,
  onClose,
  onSuccess,
}) {
  const isEditing = Boolean(client?._id);

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (client) {
      setForm({
        clientName: client.clientName ?? "",
        email: client.email ?? "",
        phone: client.phone ?? "",
        billingAddress: client.billingAddress ?? "",
        taxId: client.taxId ?? "",
        notes: client.notes ?? "",
      });
    } else {
      setForm(emptyForm);
    }

    setError("");
  }, [client]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.clientName.trim()) {
      setError("Client name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email address is required.");
      return;
    }

    setSaving(true);

    const payload = {
      clientName: form.clientName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      billingAddress: form.billingAddress.trim(),
      taxId: form.taxId.trim(),
      notes: form.notes.trim(),
    };

    try {
      if (isEditing) {
        await updateClient(client._id, payload);
      } else {
        await createClient(payload);
      }

      onSuccess(
        isEditing
          ? "Client updated successfully."
          : "Client created successfully.",
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.message ||
          `Unable to ${isEditing ? "update" : "create"} client. Please try again.`,
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-modal-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-xl"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface px-6 py-5">
          <div>
            <h2
              id="client-modal-title"
              className="text-xl font-bold text-text-primary"
            >
              {isEditing ? "Edit Client" : "Add Client"}
            </h2>

            <p className="mt-1 text-sm text-text-secondary">
              {isEditing
                ? "Update the client's billing information."
                : "Enter the client's billing information."}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close modal"
            disabled={saving}
            onClick={onClose}
            className="rounded-lg p-2 text-text-secondary hover:bg-surface-muted hover:text-text-primary"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name}>
                <label
                  htmlFor={field.name}
                  className="mb-2 block text-sm font-medium text-text-primary"
                >
                  {field.label}
                  {field.required && (
                    <span className="ml-1 text-danger">*</span>
                  )}
                </label>

                <input
                  id={field.name}
                  name={field.name}
                  type={field.type || "text"}
                  placeholder={field.placeholder}
                  value={form[field.name]}
                  onChange={handleChange}
                  required={field.required}
                  disabled={saving}
                  className={inputClass}
                />
              </div>
            ))}
          </div>

          <div>
            <label
              htmlFor="billingAddress"
              className="mb-2 block text-sm font-medium text-text-primary"
            >
              Billing Address
            </label>

            <textarea
              id="billingAddress"
              name="billingAddress"
              rows={3}
              placeholder="Enter billing address"
              value={form.billingAddress}
              onChange={handleChange}
              disabled={saving}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="mb-2 block text-sm font-medium text-text-primary"
            >
              Notes
            </label>

            <textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Optional notes about this client"
              value={form.notes}
              onChange={handleChange}
              disabled={saving}
              className={inputClass}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-border pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-surface-muted"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-text-inverse hover:bg-primary-hover disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : isEditing
                  ? "Update Client"
                  : "Save Client"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
