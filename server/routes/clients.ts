import express from "express";
import { storage } from "../storage";
import { insertClientSchema } from "@shared/schema";
import { validateRequest } from "../middlewares/validate";
import { isAuthenticated } from "../middlewares/auth";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Get all clients
router.get("/", async (req, res) => {
  try {
    // Get query parameters
    const userId = req.user?.id;
    const companyId = req.user?.companyId;
    
    if (!companyId) {
      return res.status(400).json({ error: "User doesn't belong to a company" });
    }
    
    // Get all clients for the company
    const clients = await storage.getClientsByCompanyId(companyId);
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

// Get client by ID
router.get("/:id", async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ error: "Invalid client ID" });
    }
    
    const client = await storage.getClient(clientId);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }
    
    // Check if user has access to this client (same company)
    if (client.companyId !== req.user?.companyId) {
      return res.status(403).json({ error: "Unauthorized access to client data" });
    }
    
    res.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    res.status(500).json({ error: "Failed to fetch client" });
  }
});

// Create new client
router.post("/", validateRequest(insertClientSchema), async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.id;
    
    if (!companyId) {
      return res.status(400).json({ error: "User doesn't belong to a company" });
    }
    
    // Create client with user ID and company ID
    const client = await storage.createClient({
      ...req.body,
      userId,
      companyId
    });
    
    res.status(201).json(client);
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({ error: "Failed to create client" });
  }
});

// Update client
router.patch("/:id", async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ error: "Invalid client ID" });
    }
    
    // Verify the client exists
    const existingClient = await storage.getClient(clientId);
    if (!existingClient) {
      return res.status(404).json({ error: "Client not found" });
    }
    
    // Check if user has access to this client (same company)
    if (existingClient.companyId !== req.user?.companyId) {
      return res.status(403).json({ error: "Unauthorized access to client data" });
    }
    
    // Update client
    const updatedClient = await storage.updateClient(clientId, req.body);
    res.json(updatedClient);
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ error: "Failed to update client" });
  }
});

// Delete client
router.delete("/:id", async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ error: "Invalid client ID" });
    }
    
    // Verify the client exists
    const existingClient = await storage.getClient(clientId);
    if (!existingClient) {
      return res.status(404).json({ error: "Client not found" });
    }
    
    // Check if user has access to this client (same company)
    if (existingClient.companyId !== req.user?.companyId) {
      return res.status(403).json({ error: "Unauthorized access to client data" });
    }
    
    // Delete client
    const success = await storage.deleteClient(clientId);
    if (success) {
      res.status(204).send();
    } else {
      res.status(500).json({ error: "Failed to delete client" });
    }
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

export default router;