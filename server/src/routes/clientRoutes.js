const express = require("express");
const { createClientSchema, listClientsQuerySchema, clientIdSchema, updateClientSchema } = require("../validators/clientValidator");
const validateRequest = require("../validators/validateRequest");
const authenticate = require("../middleware/authenticate");
const authorizeRole = require("../middleware/authorizeRoles");
const scopeToClient = require("../middleware/scopeToClient");
const {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
} = require("../controllers/clientController");


const router = express.Router();

router.post("/", authenticate, authorizeRole("admin"), validateRequest(createClientSchema), createClient);
router.get("/", authenticate, authorizeRole("admin"), validateRequest(listClientsQuerySchema, "query"), getClients);
router.get("/:id", authenticate, scopeToClient, validateRequest(clientIdSchema, "params"), getClientById);
router.put("/:id", authenticate, authorizeRole("admin"), validateRequest(clientIdSchema, "params"), validateRequest(updateClientSchema), updateClient);
router.delete("/:id", authenticate, authorizeRole("admin"), validateRequest(clientIdSchema, "params"), deleteClient);

module.exports = router;