/**
 * Script to update an admin user's password
 * Run with: npx tsx scripts/update-admin-password.ts
 */
import bcrypt from 'bcrypt';
import { storage } from '../server/storage';
import { db } from '../server/db';

const USERNAME = 'Stephen';
const NEW_PASSWORD = 'HeyJoe321';

async function updateAdminPassword() {
  try {
    console.log(`Attempting to update password for user: ${USERNAME}`);
    
    // Find the user by username
    const user = await storage.getUserByUsername(USERNAME);
    
    if (!user) {
      console.error(`User with username '${USERNAME}' not found.`);
      process.exit(1);
    }
    
    console.log(`Found user: ${user.name} (ID: ${user.id}, Role: ${user.role})`);
    
    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, saltRounds);
    
    // Update the user's password
    const updatedUser = await storage.updateUser(user.id, {
      password: hashedPassword
    });
    
    if (!updatedUser) {
      console.error('Failed to update password');
      process.exit(1);
    }
    
    console.log(`Password updated successfully for user: ${updatedUser.name}`);
    console.log('New credentials:');
    console.log(`  Username: ${USERNAME}`);
    console.log(`  Password: ${NEW_PASSWORD}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating admin password:', error);
    process.exit(1);
  }
}

// Run the function
updateAdminPassword();