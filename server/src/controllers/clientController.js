
const clientService = require("../services/clientService");

const createClient = async (req, res) => {
  const client = await clientService.createClient(req.body);

  return res.status(201).json({
    success: true,
    message: "Client created successfully",
    data: client,
  });
};

const getClients = async (req, res) => {
  const result = await clientService.getClients(req.query);

  return res.status(200).json({
    success: true,
    message: "Clients retrieved successfully",
    data: result.clients,
    pagination: result.pagination,
  });
};

const getClientById = async (req, res) => {
  if (
    req.clientId &&
    String(req.clientId) !== String(req.params.id)
  ) {
    return res.status(404).json({
      success: false,
      message: "Client not found",
    });
  }

  const client = await clientService.getClientById(req.params.id);

  return res.status(200).json({
    success: true,
    message: "Client retrieved successfully",
    data: client,
  });
};


const updateClient = async (req, res) => {
  const client = await clientService.updateClient(
    req.params.id,
    req.body
  );

  return res.status(200).json({
    success: true,
    message: "Client updated successfully",
    data: client,
  });
};

const deleteClient = async (req, res) => {
  await clientService.deleteClient(req.params.id);

  return res.status(200).json({
    success: true,
    message: "Client deleted successfully",
  });
};



module.exports = {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
};
