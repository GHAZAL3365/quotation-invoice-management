
import { useCallback, useEffect, useState } from "react";
import { Search, Users, RefreshCw, Plus, Pencil, Trash2 } from "lucide-react";
import { getClients, deleteClient } from "../api/clientApi";
import ClientFormModal from "../components/ClientFormModal";

function extractClients(response) {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.clients)) return data.clients;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;

  return [];
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getClients({
        page,
        limit,
        search: search.trim() || undefined,
      });

      setClients(extractClients(response));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load clients. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadClients();
    }, 250);

    return () => clearTimeout(timer);
  }, [loadClients]);

  const handleSaveSuccess = (message) => {
    setShowCreateModal(false);
    setSelectedClient(null);
    setSuccessMessage(message);

    // Return to page one after creating a client.
    if (!selectedClient) {
      setPage(1);
    }

    loadClients();
  };

  const handleDelete = async (client) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${client.clientName}"?`,
    );

    if (!confirmed) return;

    setDeletingId(client._id);
    setError("");
    setSuccessMessage("");

    try {
      await deleteClient(client._id);

      setSuccessMessage("Client deleted successfully.");

      // If the last record on a page was deleted, go back one page.
      if (clients.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadClients();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete client. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setSelectedClient(null);
  };

  
return (
  <section className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Clients
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your client information and billing details.
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          setSuccessMessage("");
          setError("");
          setSelectedClient(null);
          setShowCreateModal(true);
        }}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
      >
        <Plus size={18} />
        Add client
      </button>
    </div>

    {successMessage && (
      <div
        role="status"
        className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
      >
        <span>{successMessage}</span>
        <button
          type="button"
          onClick={() => setSuccessMessage("")}
          className="font-semibold"
        >
          Dismiss
        </button>
      </div>
    )}

    {error && (
      <div
        role="alert"
        className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        <span>{error}</span>
        <button
          type="button"
          onClick={loadClients}
          className="font-semibold"
        >
          Retry
        </button>
      </div>
    )}

    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
              setSuccessMessage("");
            }}
            placeholder="Search client name or email..."
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-text-primary outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadClients}
            disabled={loading}
            title="Refresh clients"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm text-text-primary hover:bg-surface-muted disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[850px] border-collapse text-left">
          <thead>
            <tr className="border-y border-border bg-surface-muted text-xs uppercase tracking-wide text-text-secondary">
              <th className="px-4 py-3 font-semibold">Client</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-sm text-text-secondary"
                >
                  Loading clients...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <p className="font-medium text-text-primary">
                    No clients found
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Try changing your search or add a new client.
                  </p>
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr
                  key={client._id}
                  className="transition hover:bg-surface-muted/60"
                >
                  <td className="px-4 py-4">
                    <span className="font-semibold text-primary">
                      {client.clientName || "—"}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-sm text-text-primary">
                    {client.email || "—"}
                  </td>

                  <td className="px-4 py-4 text-sm text-text-secondary">
                    {client.phone || "—"}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={
                        client.isActive
                          ? "inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700"
                          : "inline-flex rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-text-secondary"
                      }
                    >
                      {client.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        title="Edit client"
                        aria-label={`Edit ${client.clientName}`}
                        onClick={() => {
                          setError("");
                          setSuccessMessage("");
                          setSelectedClient(client);
                          setShowCreateModal(false);
                        }}
                        className="rounded-md p-2 text-text-secondary hover:bg-amber-50 hover:text-warning"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        title="Delete client"
                        aria-label={`Delete ${client.clientName}`}
                        disabled={deletingId === client._id}
                        onClick={() => handleDelete(client)}
                        className="rounded-md p-2 text-text-secondary hover:bg-red-50 hover:text-danger disabled:opacity-50"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-secondary">
          {clients.length
            ? `${clients.length} clients`
            : "0 clients"}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <span className="min-w-20 text-center text-sm text-text-secondary">
            Page {page}
          </span>

          <button
            type="button"
            disabled={clients.length < limit || loading}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    {(showCreateModal || selectedClient) && (
      <ClientFormModal
        key={selectedClient?._id || "new-client"}
        client={selectedClient}
        onClose={closeModal}
        onSuccess={handleSaveSuccess}
      />
    )}
  </section>
);

}
