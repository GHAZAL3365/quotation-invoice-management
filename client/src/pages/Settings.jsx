import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Building,
  FileSpreadsheet,
  FileText,
  CreditCard,
  Percent,
  Mail,
  Languages,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  RotateCcw,
} from "lucide-react";
import api from "../api/api";

const TABS = [
  { id: "general", label: "General", icon: SettingsIcon },
  { id: "business", label: "Business", icon: Building },
  { id: "quotation", label: "Quotes", icon: FileSpreadsheet },
  { id: "invoice", label: "Invoices", icon: FileText },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "tax", label: "Tax", icon: Percent },
  { id: "emails", label: "Emails", icon: Mail },
  { id: "translate", label: "Translate", icon: Languages },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  const [settings, setSettings] = useState({
    general: {
      yearStart: "01 Apr",
      yearEnd: "31 Mar",
      predefinedLineItems: [],
    },
    business: {
      logo: "",
      businessName: "Ultrakey IT Solutions Private Limited",
      address:
        "Flat No. 204, 2nd Floor, Cyber Residency, Indira Nagar, Gachibowli, Hyderabad, Telangana, India-500032",
      taxId: "36AADCU5062A1Z0",
      email: "support@ultrakeyit.com",
      phone: "+91 63004 40316",
      website: "https://ultrakeyit.com",
      extraInfo: "GST No: 36AADCU5062A1Z0",
    },
    quotation: {
      prefix: "AKEYQ-",
      suffix: "",
      autoIncrement: true,
      nextNumber: "52",
      validDays: 15,
      hideAdjustField: false,
      terms:
        "This is a fixed price quote. If accepted, we require a 60% deposit upfront before work commences.",
      footer:
        "Thanks for choosing Ultrakey IT Solutions Private Limited | support@ultrakeyit.com",
      acceptQuoteButton: true,
      acceptQuoteAction: "Convert Quote to Invoice and send to client",
      acceptQuoteText:
        "Please Note: After accepting this Quote an Invoice will be automatically generated. This will then become a legally binding contract.",
      declineReasonRequired: true,
      template: "template1",
    },
    invoice: {
      prefix: "AKEYI-",
      suffix: "",
      autoIncrement: true,
      nextNumber: "0126",
      dueDays: 14,
      hideAdjustField: false,
      terms:
        "Payment is due within 14 days from date of invoice. Late payment is subject to fees of 5% per month.\n\nPayment Methods:\n- 60% Advance Payment for Commencement\n- Remaining 40% Final Settlement",
      footer:
        "Thanks for choosing Ultrakey IT Solutions Private Limited | support@ultrakeyit.com",
      template: "template2",
    },
    payments: {
      currencySymbol: "₹",
      currencyPosition: "Left",
      thousandSeparator: ",",
      decimalSeparator: ".",
      decimals: 2,
      bankDetails:
        "Account Number: 50200092611852\nName: Ultrakey IT Solutions Pvt. Ltd.\nIFSC: HDFC0000968\nBranch: GACHIBOWLI",
      genericPayment:
        "Pay invoice via Gpay (or) Phonepe Number: 6300440316\nor Online Payment through Razorpay",
    },
    tax: {
      pricesEnteredWithTax: false,
      taxPercentage: 18,
      taxName: "GST (18%)",
    },
    emails: {
      emailAddress: "support@ultrakeyit.com",
      emailName: "Ultrakey IT Solutions Private Limited",
      bccClientEmails: true,
      quoteSubject: "New quote %number% available",
      invoiceSubject: "New invoice %number% available",
      paymentSubject: "Thanks for your payment",
    },
    translate: {
      quoteLabel: "Quote",
      quoteLabelPlural: "Quotes",
      invoiceLabel: "Invoice",
      invoiceLabelPlural: "Invoices",
      hrsQty: "Hrs/Qty",
      service: "Service",
      ratePrice: "Rate/Price",
      adjust: "Adjust",
      subTotal: "Sub Total",
      discount: "Discount",
      total: "Total",
      totalDue: "Total Due",
    },
  });

  const [newLineItem, setNewLineItem] = useState({
    qty: 1,
    title: "",
    rate: "",
    description: "",
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/settings");
      if (res.data?.data) {
        setSettings((prev) => ({
          ...prev,
          ...res.data.data,
        }));
      }
    } catch (err) {
      console.warn("Using default settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError("");
    setSaveSuccess(false);

    try {
      await api.put("/settings", settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSubSection = (section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleAddPredefinedItem = () => {
    if (!newLineItem.title || !newLineItem.rate) return;
    const items = settings.general?.predefinedLineItems || [];
    setSettings((prev) => ({
      ...prev,
      general: {
        ...prev.general,
        predefinedLineItems: [
          ...items,
          {
            qty: Number(newLineItem.qty) || 1,
            title: newLineItem.title,
            rate: Number(newLineItem.rate) || 0,
            description: newLineItem.description || newLineItem.title,
          },
        ],
      },
    }));
    setNewLineItem({ qty: 1, title: "", rate: "", description: "" });
  };

  const handleRemovePredefinedItem = (index) => {
    const items = [...(settings.general?.predefinedLineItems || [])];
    items.splice(index, 1);
    setSettings((prev) => ({
      ...prev,
      general: {
        ...prev.general,
        predefinedLineItems: items,
      },
    }));
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Application Settings
          </h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Configure invoice parameters, quotation terms, Ultrakey business
            profile, and tax rules.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-text-inverse shadow-xs transition hover:bg-primary-hover disabled:opacity-60"
        >
          {saving ? (
            <RotateCcw className="animate-spin" size={16} />
          ) : (
            <Save size={16} />
          )}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600" />
          Settings have been saved successfully and applied across the system.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
          {error}
        </div>
      )}

      {/* Settings Container with Tabs */}
      <div className="flex flex-col rounded-2xl border border-border bg-surface shadow-xs lg:flex-row">
        {/* Left Vertical / Horizontal Tabs */}
        <div className="w-full border-b border-border p-3 lg:w-60 lg:border-r lg:border-b-0 lg:p-4">
          <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  type="button"
                  className={`flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    active
                      ? "bg-primary text-text-inverse shadow-xs"
                      : "text-text-secondary hover:bg-slate-100 hover:text-text-primary"
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 p-5 sm:p-7">
          {/* TAB 1: GENERAL */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  General Settings
                </h3>
                <p className="text-xs text-text-secondary">
                  Fiscal year dates and pre-defined line items for quotes and
                  invoices.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text-primary">
                    Year Start (Fiscal Year)
                  </label>
                  <select
                    value={settings.general?.yearStart || "01 Apr"}
                    onChange={(e) =>
                      updateSubSection("general", "yearStart", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none"
                  >
                    <option value="01 Jan">01 Jan</option>
                    <option value="01 Apr">01 Apr (Indian Financial Year)</option>
                    <option value="01 Jul">01 Jul</option>
                    <option value="01 Oct">01 Oct</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text-primary">
                    Year End (Fiscal Year)
                  </label>
                  <select
                    value={settings.general?.yearEnd || "31 Mar"}
                    onChange={(e) =>
                      updateSubSection("general", "yearEnd", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none"
                  >
                    <option value="31 Dec">31 Dec</option>
                    <option value="31 Mar">31 Mar (Indian Financial Year)</option>
                    <option value="30 Jun">30 Jun</option>
                    <option value="30 Sep">30 Sep</option>
                  </select>
                </div>
              </div>

              {/* Pre-Defined Line Items Section */}
              <div className="rounded-xl border border-border bg-slate-50/50 p-4">
                <div className="mb-3">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Pre-Defined Line Items
                  </h4>
                  <p className="text-[11px] text-text-secondary">
                    These items will appear in the "Add a pre-defined line item"
                    picker when drafting Invoices and Quotes.
                  </p>
                </div>

                {/* Add new predefined line item row */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 mb-3">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={newLineItem.qty}
                    onChange={(e) =>
                      setNewLineItem({ ...newLineItem, qty: e.target.value })
                    }
                    className="sm:col-span-2 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs text-text-primary"
                  />
                  <input
                    type="text"
                    placeholder="Item Title (e.g. Hosting Plan for 1 year)"
                    value={newLineItem.title}
                    onChange={(e) =>
                      setNewLineItem({ ...newLineItem, title: e.target.value })
                    }
                    className="sm:col-span-4 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs text-text-primary"
                  />
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    value={newLineItem.rate}
                    onChange={(e) =>
                      setNewLineItem({ ...newLineItem, rate: e.target.value })
                    }
                    className="sm:col-span-2 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs text-text-primary"
                  />
                  <input
                    type="text"
                    placeholder="Description / Scope"
                    value={newLineItem.description}
                    onChange={(e) =>
                      setNewLineItem({
                        ...newLineItem,
                        description: e.target.value,
                      })
                    }
                    className="sm:col-span-3 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs text-text-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddPredefinedItem}
                    className="sm:col-span-1 flex items-center justify-center rounded-lg bg-primary py-1.5 text-white hover:bg-primary-hover"
                    title="Add Item"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Items list */}
                <div className="space-y-2">
                  {(settings.general?.predefinedLineItems || []).map(
                    (item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white p-2.5 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-text-primary">
                            {item.title}{" "}
                            <span className="text-text-secondary font-normal">
                              ({item.qty} × ₹{item.rate})
                            </span>
                          </p>
                          <p className="text-[11px] text-text-secondary truncate">
                            {item.description}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePredefinedItem(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BUSINESS */}
          {activeTab === "business" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Business Settings
                </h3>
                <p className="text-xs text-text-secondary">
                  These details appear on header cards and PDF copies of all
                  Invoices & Quotations.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={settings.business?.businessName || ""}
                    onChange={(e) =>
                      updateSubSection(
                        "business",
                        "businessName",
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Company Registered Address
                  </label>
                  <textarea
                    rows={3}
                    value={settings.business?.address || ""}
                    onChange={(e) =>
                      updateSubSection("business", "address", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    GST No / Tax ID
                  </label>
                  <input
                    type="text"
                    value={settings.business?.taxId || ""}
                    onChange={(e) =>
                      updateSubSection("business", "taxId", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={settings.business?.email || ""}
                    onChange={(e) =>
                      updateSubSection("business", "email", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Official Contact Phone
                  </label>
                  <input
                    type="text"
                    value={settings.business?.phone || ""}
                    onChange={(e) =>
                      updateSubSection("business", "phone", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={settings.business?.website || ""}
                    onChange={(e) =>
                      updateSubSection("business", "website", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QUOTATION */}
          {activeTab === "quotation" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Quotation Settings
                </h3>
                <p className="text-xs text-text-secondary">
                  Prefix numbering, validity period, and default terms for
                  quotes.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Quote Number Prefix
                  </label>
                  <input
                    type="text"
                    value={settings.quotation?.prefix || "AKEYQ-"}
                    onChange={(e) =>
                      updateSubSection("quotation", "prefix", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Next Quote Number
                  </label>
                  <input
                    type="text"
                    value={settings.quotation?.nextNumber || "52"}
                    onChange={(e) =>
                      updateSubSection(
                        "quotation",
                        "nextNumber",
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Valid For (Days)
                  </label>
                  <input
                    type="number"
                    value={settings.quotation?.validDays || 15}
                    onChange={(e) =>
                      updateSubSection("quotation", "validDays", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-text-primary">
                  Default Quotation Terms & Conditions
                </label>
                <textarea
                  rows={3}
                  value={settings.quotation?.terms || ""}
                  onChange={(e) =>
                    updateSubSection("quotation", "terms", e.target.value)
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-text-primary">
                  Accept Quote Confirmation Notice
                </label>
                <textarea
                  rows={2}
                  value={settings.quotation?.acceptQuoteText || ""}
                  onChange={(e) =>
                    updateSubSection(
                      "quotation",
                      "acceptQuoteText",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                />
              </div>
            </div>
          )}

          {/* TAB 4: INVOICES */}
          {activeTab === "invoice" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Invoice Settings
                </h3>
                <p className="text-xs text-text-secondary">
                  Prefix numbering, due days, terms and design template.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Invoice Prefix
                  </label>
                  <input
                    type="text"
                    value={settings.invoice?.prefix || "AKEYI-"}
                    onChange={(e) =>
                      updateSubSection("invoice", "prefix", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Next Invoice Number
                  </label>
                  <input
                    type="text"
                    value={settings.invoice?.nextNumber || "0126"}
                    onChange={(e) =>
                      updateSubSection("invoice", "nextNumber", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Default Due Period (Days)
                  </label>
                  <input
                    type="number"
                    value={settings.invoice?.dueDays || 14}
                    onChange={(e) =>
                      updateSubSection("invoice", "dueDays", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-text-primary">
                  Default Payment Terms & Method Instructions
                </label>
                <textarea
                  rows={4}
                  value={settings.invoice?.terms || ""}
                  onChange={(e) =>
                    updateSubSection("invoice", "terms", e.target.value)
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                />
              </div>

              {/* Template Design Selector */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-text-primary">
                  Invoice PDF & Print Template Design
                </label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div
                    onClick={() =>
                      updateSubSection("invoice", "template", "template1")
                    }
                    className={`cursor-pointer rounded-xl border-2 p-3 transition ${
                      settings.invoice?.template === "template1"
                        ? "border-primary bg-blue-50/40"
                        : "border-border hover:border-slate-300"
                    }`}
                  >
                    <div className="h-2 w-full rounded bg-[#203B5B] mb-2" />
                    <p className="font-bold text-xs text-text-primary">
                      Template 1: Classic Top Band
                    </p>
                    <p className="text-[11px] text-text-secondary mt-1">
                      Traditional header with brand bar, two-panel client box,
                      and full-width summary.
                    </p>
                  </div>

                  <div
                    onClick={() =>
                      updateSubSection("invoice", "template", "template2")
                    }
                    className={`cursor-pointer rounded-xl border-2 p-3 transition ${
                      settings.invoice?.template === "template2"
                        ? "border-primary bg-blue-50/40"
                        : "border-border hover:border-slate-300"
                    }`}
                  >
                    <div className="flex h-5 w-full items-center justify-between rounded bg-[#203B5B] px-2 text-[9px] text-white font-bold mb-2">
                      <span>ULTRAKEY</span>
                      <span>INVOICE</span>
                    </div>
                    <p className="font-bold text-xs text-text-primary">
                      Template 2: Modern Dual Header
                    </p>
                    <p className="text-[11px] text-text-secondary mt-1">
                      Two-tone header with bank instructions callout card and bold
                      table headings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PAYMENTS */}
          {activeTab === "payments" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Payment Settings
                </h3>
                <p className="text-xs text-text-secondary">
                  Currency preferences, bank account details, and online payment
                  options.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={settings.payments?.currencySymbol || "₹"}
                    onChange={(e) =>
                      updateSubSection(
                        "payments",
                        "currencySymbol",
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Currency Position
                  </label>
                  <select
                    value={settings.payments?.currencyPosition || "Left"}
                    onChange={(e) =>
                      updateSubSection(
                        "payments",
                        "currencyPosition",
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  >
                    <option value="Left">Left (₹100.00)</option>
                    <option value="Right">Right (100.00 ₹)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Decimal Places
                  </label>
                  <input
                    type="number"
                    value={settings.payments?.decimals || 2}
                    onChange={(e) =>
                      updateSubSection("payments", "decimals", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-text-primary">
                  Bank Account Details (Printed on Invoices)
                </label>
                <textarea
                  rows={4}
                  value={settings.payments?.bankDetails || ""}
                  onChange={(e) =>
                    updateSubSection("payments", "bankDetails", e.target.value)
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary font-mono"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-text-primary">
                  Generic / UPI Payment Options
                </label>
                <textarea
                  rows={3}
                  value={settings.payments?.genericPayment || ""}
                  onChange={(e) =>
                    updateSubSection(
                      "payments",
                      "genericPayment",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                />
              </div>
            </div>
          )}

          {/* TAB 6: TAX */}
          {activeTab === "tax" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Tax Settings
                </h3>
                <p className="text-xs text-text-secondary">
                  Default GST rates and price tax inclusion configuration.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Tax Name / Label
                  </label>
                  <input
                    type="text"
                    value={settings.tax?.taxName || "GST (18%)"}
                    onChange={(e) =>
                      updateSubSection("tax", "taxName", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Default Tax Percentage (%)
                  </label>
                  <input
                    type="number"
                    value={settings.tax?.taxPercentage || 18}
                    onChange={(e) =>
                      updateSubSection("tax", "taxPercentage", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-slate-50/50 p-4">
                <p className="text-xs font-semibold text-text-primary">
                  Tax Calculation Mode
                </p>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                    <input
                      type="radio"
                      name="taxMode"
                      checked={!settings.tax?.pricesEnteredWithTax}
                      onChange={() =>
                        updateSubSection("tax", "pricesEnteredWithTax", false)
                      }
                      className="text-primary"
                    />
                    <span>No, I will enter prices exclusive of tax (Recommended)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                    <input
                      type="radio"
                      name="taxMode"
                      checked={settings.tax?.pricesEnteredWithTax}
                      onChange={() =>
                        updateSubSection("tax", "pricesEnteredWithTax", true)
                      }
                      className="text-primary"
                    />
                    <span>Yes, I will enter prices inclusive of tax</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: EMAILS */}
          {activeTab === "emails" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Email Settings
                </h3>
                <p className="text-xs text-text-secondary">
                  Automated notification templates for quotes, invoices, and
                  payment receipts.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Sender Email Address
                  </label>
                  <input
                    type="email"
                    value={settings.emails?.emailAddress || "support@ultrakeyit.com"}
                    onChange={(e) =>
                      updateSubSection("emails", "emailAddress", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Sender Display Name
                  </label>
                  <input
                    type="text"
                    value={
                      settings.emails?.emailName ||
                      "Ultrakey IT Solutions Private Limited"
                    }
                    onChange={(e) =>
                      updateSubSection("emails", "emailName", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-text-primary">
                  New Quote Email Subject
                </label>
                <input
                  type="text"
                  value={
                    settings.emails?.quoteSubject ||
                    "New quote %number% available"
                  }
                  onChange={(e) =>
                    updateSubSection("emails", "quoteSubject", e.target.value)
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-text-primary">
                  New Invoice Email Subject
                </label>
                <input
                  type="text"
                  value={
                    settings.emails?.invoiceSubject ||
                    "New invoice %number% available"
                  }
                  onChange={(e) =>
                    updateSubSection("emails", "invoiceSubject", e.target.value)
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                />
              </div>
            </div>
          )}

          {/* TAB 8: TRANSLATE */}
          {activeTab === "translate" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Translation & Field Labels
                </h3>
                <p className="text-xs text-text-secondary">
                  Customize table header and invoice labels to match your regional
                  terminology.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Quote Label (Singular)
                  </label>
                  <input
                    type="text"
                    value={settings.translate?.quoteLabel || "Quote"}
                    onChange={(e) =>
                      updateSubSection("translate", "quoteLabel", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Quote Label (Plural)
                  </label>
                  <input
                    type="text"
                    value={settings.translate?.quoteLabelPlural || "Quotes"}
                    onChange={(e) =>
                      updateSubSection(
                        "translate",
                        "quoteLabelPlural",
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Hrs / Qty Label
                  </label>
                  <input
                    type="text"
                    value={settings.translate?.hrsQty || "Hrs/Qty"}
                    onChange={(e) =>
                      updateSubSection("translate", "hrsQty", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Service / Description Label
                  </label>
                  <input
                    type="text"
                    value={settings.translate?.service || "Service"}
                    onChange={(e) =>
                      updateSubSection("translate", "service", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Rate / Price Label
                  </label>
                  <input
                    type="text"
                    value={settings.translate?.ratePrice || "Rate/Price"}
                    onChange={(e) =>
                      updateSubSection("translate", "ratePrice", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-primary">
                    Total Due Label
                  </label>
                  <input
                    type="text"
                    value={settings.translate?.totalDue || "Total Due"}
                    onChange={(e) =>
                      updateSubSection("translate", "totalDue", e.target.value)
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
