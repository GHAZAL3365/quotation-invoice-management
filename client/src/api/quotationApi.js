
import api from "./api";

const quotationService = {
  async getQuotations(params = {}) {
    const response = await api.get("/quotations", { params });
    return response.data.data;
  },

  async getQuotationById(id) {
    const response = await api.get(`/quotations/${id}`);
    return response.data.data;
  },

  async createQuotation(payload) {
    const response = await api.post("/quotations", payload);
    return response.data;
  },

  async updateQuotation(id, payload) {
    const response = await api.patch(`/quotations/${id}`, payload);
    return response.data;
  },

  async deleteQuotation(id) {
    const response = await api.delete(`/quotations/${id}`);
    return response.data;
  },

  async downloadQuotationPdf(id) {
    const response = await api.get(`/quotations/${id}/pdf`, {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");

    link.href = url;
    link.download = `quotation-${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  },
};

export default quotationService;
