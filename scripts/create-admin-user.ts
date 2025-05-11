/**
 * Script to create an admin user for the system
 * Run with: npx tsx scripts/create-admin-user.ts
 */

import { db } from "../server/db";
import { users } from "../shared/schema";
import { hashPassword } from "../server/lib/auth-helpers";
import { eq } from "drizzle-orm";

async function createAdminUser() {
  try {
    // Admin credentials
    const adminUsername = "Stephen";
    const adminPassword = "$tevem789!";
    const adminEmail = "admin@pricebetter.ai";
    const adminName = "Stephen";
    const adminRole = "admin";

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, adminUsername)
    });

    if (existingUser) {
      console.log(`Admin user '${adminUsername}' already exists.`);
      
      // Update the password if requested
      const updatePassword = true; // Set to false if you don't want to update the password
      
      if (updatePassword) {
        const hashedPassword = await hashPassword(adminPassword);
        await db.update(users)
          .set({ password: hashedPassword })
          .where(eq(users.username, adminUsername))
          .returning();
        console.log(`Password updated for admin user '${adminUsername}'.`);
      }
      
      process.exit(0);
    }

    // Hash the password
    const hashedPassword = await hashPassword(adminPassword);

    // Create the admin user
    const [newUser] = await db.insert(users)
      .values({
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: adminRole
      })
      .returning();

    console.log(`Admin user created successfully:`);
    console.log(`Username: ${newUser.username}`);
    console.log(`Role: ${newUser.role}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

// Run the function
createAdminUser();