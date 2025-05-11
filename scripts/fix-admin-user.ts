/**
 * Script to fix the "admin" account password
 * Run with: npx tsx scripts/fix-admin-user.ts
 */
import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Utility for password hashing
const hashPassword = async (password: string): Promise<string> => {
  // Generate a random salt
  const salt = crypto.randomBytes(16).toString('hex');
  
  // Use scrypt for hashing (more secure than bcrypt)
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Store as salt.hash
      resolve(`${salt}.${derivedKey.toString('hex')}`);
    });
  });
};

async function fixAdminUser() {
  try {
    if (!db) {
      console.error('Database connection not available');
      return;
    }
    
    console.log('Fixing admin user password...');
    
    // Find the admin user with username "admin"
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.username, 'admin'))
      .limit(1);
    
    if (!adminUser.length) {
      console.error('Admin user not found');
      return;
    }
    
    const admin = adminUser[0];
    console.log(`Found admin user: ${admin.username} (ID: ${admin.id}, Email: ${admin.email})`);
    
    // Set the password
    const password = 'HeyJoe321';
    const hashedPassword = await hashPassword(password);
    
    // Update the password
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, admin.id));
    
    console.log(`Admin user password updated successfully to: ${password}`);
    
  } catch (error) {
    console.error('Error fixing admin user:', error);
  } finally {
    // Close database connections
    try {
      console.log('Closing database connection...');
      process.exit(0);
    } catch (e) {
      console.error('Error closing connection:', e);
      process.exit(1);
    }
  }
}

// Run the fix
fixAdminUser();