/**
 * Script to fix admin passwords
 * Run with: npx tsx scripts/fix-admin-passwords.ts
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

async function updateAdminPasswords() {
  try {
    if (!db) {
      console.error('Database connection not available');
      return;
    }
    
    // Get all admin users
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'));
    
    if (!adminUsers.length) {
      console.log('No admin users found in the database');
      return;
    }
    
    console.log(`Found ${adminUsers.length} admin users to update:`);
    
    // Update each admin user's password
    for (const admin of adminUsers) {
      console.log(`\nUpdating admin: ${admin.username} (${admin.email})`);
      
      // Set a fixed password for all admins for testing
      const newPassword = 'HeyJoe321';
      const newPasswordHash = await hashPassword(newPassword);
      
      // Update the user's password in the database
      await db
        .update(users)
        .set({ password: newPasswordHash })
        .where(eq(users.id, admin.id));
      
      console.log(`Password updated for ${admin.username} to "${newPassword}"`);
    }
    
    console.log('\nAll admin passwords have been updated successfully!');
    
  } catch (error) {
    console.error('Error updating admin passwords:', error);
  } finally {
    // Close database connections
    try {
      console.log('\nClosing database connections...');
      process.exit(0);
    } catch (e) {
      console.error('Error closing connections:', e);
      process.exit(1);
    }
  }
}

// Run the password update
updateAdminPasswords();