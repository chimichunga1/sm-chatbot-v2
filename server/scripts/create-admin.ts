import { db } from "../db";
import { storage } from "../storage";
import { hashPassword } from "../lib/auth-helpers";

async function createAdminUser() {
  try {
    console.log("Checking if admin user already exists...");
    const existingUser = await storage.getUserByUsername("admin");
    
    if (existingUser) {
      console.log("Admin user already exists.");
      return;
    }
    
    console.log("Creating admin user...");
    
    // First, check if we need to create a default company
    let company = await storage.getCompanyByName("Acme Inc.");
    if (!company) {
      console.log("Creating default company...");
      company = await storage.createCompany({ name: "Acme Inc.", isActive: true });
    }
    
    // Hash the password
    const hashedPassword = await hashPassword("stevem78");
    
    // Create the admin user
    const adminUser = await storage.createUser({
      username: "admin",
      email: "admin@example.com",
      password: hashedPassword,
      name: "Administrator",
      role: "admin",
      companyId: company.id,
      isActive: true
    });
    
    console.log("Admin user created successfully:", {
      id: adminUser.id,
      username: adminUser.username,
      role: adminUser.role
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    process.exit(0);
  }
}

createAdminUser();