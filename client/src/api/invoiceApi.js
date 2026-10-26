
import api from "./api";

export const getInvoices = (params = {}) =>
  api.get("/invoices", { params });

export const getInvoiceById = (id) =>
  api.get(`/invoices/${id}`);

export const createInvoice = (payload) =>
  api.post("/invoices", payload);

export const updateInvoice = (id, payload) =>
  api.put(`/invoices/${id}`, payload);

export const deleteInvoice = (id) =>
  api.delete(`/invoices/${id}`);

export const downloadInvoicePdf = (id) =>
  api.get(`/invoices/${id}/pdf`, {
    responseType: "blob",
  });

export const getInvoicePayments = (id, params = {}) =>
  api.get(`/invoices/${id}/payments`, { params });

export const recordInvoicePayment = (id, payload) =>
  api.post(`/invoices/${id}/payments`, payload);
