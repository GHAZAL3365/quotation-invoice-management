
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Download,
  Trash2,
  FileText,
  RefreshCw,
  Eye,
  Pencil
} from "lucide-react";

import quotationService from "../api/quotationApi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Pagination from "../components/Pagination";

const statusStyles = {
  Draft: "bg-slate-100 text-slate-700",
  Sent: "bg-blue-100 text-blue-700",
  Accepted: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-red-100 text-red-700",
  Expired: "bg-amber-100 text-amber-700",
};

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.message ||
    "Something went wrong. Please try again."
  );
}

export default function Quotations() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [quotations, setQuotations] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");
  const navigate = useNavigate();

  const loadQuotations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await quotationService.getQuotations({
        page: pagination.page,
        limit: pagination.limit,
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
      });

      setQuotations(
        Array.isArray(result?.quotations) ? result.quotations : []
      );

      setPagination((current) => ({
        ...current,
        ...(result?.pagination || {}),
      }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, status]);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  function handleSearch(event) {
    event.preventDefault();
    setPagination((current) => ({ ...current, page: 1 }));
    setSearch(searchInput.trim());
  }

  async function handleDelete(quotation) {
    const confirmed = window.confirm(
      `Delete quotation ${quotation.quotationNumber}?`
    );

    if (!confirmed) return;

    setActionId(quotation._id);
    setError("");

    try {
      await quotationService.deleteQuotation(quotation._id);

      if (quotations.length === 1 && pagination.page > 1) {
        setPagination((current) => ({
          ...current,
          page: current.page - 1,
        }));
      } else {
        await loadQuotations();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionId("");
    }
  }

  async function handleDownload(quotation) {
    setActionId(quotation._id);
    setError("");

    try {
      await quotationService.downloadQuotationPdf(quotation._id);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionId("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            SALES MANAGEMENT
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Quotations
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin
              ? "Create, track, and manage customer quotations."
              : "View your quotations and their current status."}
          </p>
        </div>

        {isAdmin && (
          <Link
            to="/quotations/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus size={18} />
            Create Quotation
          </Link>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={loadQuotations}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <form
            onSubmit={handleSearch}
            className="flex w-full gap-2 lg:max-w-md"
          >
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search quotation number..."
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2">
            <label
              htmlFor="quotation-status"
              className="text-sm text-slate-500"
            >
              Status
            </label>

            <select
              id="quotation-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPagination((current) => ({
                  ...current,
                  page: 1,
                }));
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="">All statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Expired">Expired</option>
            </select>

            <button
              type="button"
              onClick={loadQuotations}
              disabled={loading}
              aria-label="Refresh quotations"
              className="rounded-lg border border-slate-300 p-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Quotation</th>
                <th className="px-5 py-4 font-semibold">Client</th>
                <th className="px-5 py-4 font-semibold">Quotation Date</th>
                <th className="px-5 py-4 font-semibold">Valid Until</th>
                <th className="px-5 py-4 font-semibold">Total</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-slate-500">
                    Loading quotations...
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <FileText className="mx-auto mb-3 text-slate-400" size={32} />
                    <p className="font-medium text-slate-700">
                      No quotations found
                    </p>
                    <p className="mt-1 text-slate-500">
                      {isAdmin
                        ? "Create a quotation or change your search filters."
                        : "There are no quotations matching your filters."}
                    </p>
                  </td>
                </tr>
              ) : (
                quotations.map((quotation) => {
                  const client = quotation.clientId;

                  return (
                    <tr
                      key={quotation._id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <Link
                          to={`/quotations/${quotation._id}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {quotation.quotationNumber}
                        </Link>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {typeof client === "object"
                            ? client?.clientName || client?.name || "Client"
                            : "—"}
                        </p>
                        {typeof client === "object" && client?.email && (
                          <p className="mt-1 text-xs text-slate-500">
                            {client.email}
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(quotation.quotationDate)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(quotation.validUntil)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                        {formatCurrency(quotation.total)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[quotation.status] ||
                            "bg-slate-100 text-slate-700"
                            }`}
                        >
                          {quotation.status || "Draft"}
                        </span>
                      </td>

                      <td className="px-5 py-4">


                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/quotations/${quotation._id}`)
                            }
                            title="View Quotation"
                            aria-label="View Quotation"
                            className="rounded-lg p-2 text-text-secondary transition hover:bg-primary/10 hover:text-primary"
                          >
                            <Eye size={18} />
                          </button>

                          {/* Edit quotation */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/quotations/${quotation._id}/edit`)
                              }
                              title="Edit Quotation"
                              aria-label="Edit Quotation"
                              className="rounded-lg p-2 text-text-secondary transition hover:bg-primary/10 hover:text-primary"
                            >
                              <Pencil size={18} />
                            </button>
                          )}

                          <button
                            type="button"
                            title="Download PDF"
                            aria-label={`Download ${quotation.quotationNumber} PDF`}
                            disabled={actionId === quotation._id}
                            onClick={() => handleDownload(quotation)}
                            className="rounded-md p-2 text-slate-500 hover:bg-blue-50 hover:text-primary disabled:opacity-50"
                          >
                            <Download size={17} />
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              title="Delete quotation"
                              aria-label={`Delete ${quotation.quotationNumber}`}
                              disabled={actionId === quotation._id}
                              onClick={() => handleDelete(quotation)}
                              className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            >
                              <Trash2 size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={pagination.limit}
          itemCount={quotations.length}
          itemLabel="quotations"
          loading={loading}
          onPageChange={(page) =>
            setPagination((current) => ({ ...current, page }))
          }
        />
      </div>
    </div>
  );
}
