/**
 * Script to test login credentials
 * Run with: npx tsx scripts/test-login.ts
 */
import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import crypto from 'crypto';

// Utility for password hashing and verification
const verifyPassword = async (inputPassword: string, storedHash: string): Promise<boolean> => {
  // Check if it's a scrypt hash (contains a dot as separator)
  if (storedHash.includes('.')) {
    const [salt, hash] = storedHash.split('.');
    const keyLength = Buffer.from(hash, 'hex').length;
    
    return new Promise((resolve, reject) => {
      crypto.scrypt(inputPassword, salt, keyLength, (err, derivedKey) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(derivedKey.toString('hex') === hash);
      });
    });
  } else {
    // Assume it's bcrypt
    try {
      return await bcrypt.compare(inputPassword, storedHash);
    } catch (e) {
      console.error('Error comparing passwords with bcrypt:', e);
      return false;
    }
  }
};

async function testUserCredentials() {
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
    
    console.log(`\nFound ${adminUsers.length} admin users:`);
    
    // Test credentials for each admin
    for (const admin of adminUsers) {
      console.log(`\n==== Testing admin: ${admin.username} (${admin.email}) ====`);
      console.log(`ID: ${admin.id}`);
      console.log(`Password hash format: ${admin.password?.includes('.') ? 'scrypt' : 'bcrypt'}`);
      
      // Test password: HeyJoe321
      const testPassword = 'HeyJoe321';
      
      // Verify password
      let passwordMatch = false;
      try {
        if (admin.password) {
          passwordMatch = await verifyPassword(testPassword, admin.password);
        }
      } catch (error) {
        console.error('Password verification error:', error);
      }
      
      console.log(`Password "${testPassword}" verification: ${passwordMatch ? '✅ Valid' : '❌ Invalid'}`);
      
      // Also test with a specific username lookup as the login endpoint does
      const usernameUser = await db
        .select()
        .from(users)
        .where(eq(users.username, admin.username));
      
      console.log(`\nDirect username lookup for "${admin.username}": ${usernameUser.length ? '✅ Found' : '❌ Not found'}`);
      
      // Check case-insensitive username lookup
      const lowercaseUsername = admin.username.toLowerCase();
      const allUsers = await db.select().from(users);
      const caseInsensitiveMatch = allUsers.find(
        u => u.username.toLowerCase() === lowercaseUsername
      );
      
      console.log(`Case-insensitive username lookup for "${lowercaseUsername}": ${caseInsensitiveMatch ? '✅ Found' : '❌ Not found'}`);
      
      // Check case-insensitive email lookup
      if (admin.email) {
        const lowercaseEmail = admin.email.toLowerCase();
        const emailMatch = allUsers.find(
          u => u.email && u.email.toLowerCase() === lowercaseEmail
        );
        
        console.log(`Case-insensitive email lookup for "${lowercaseEmail}": ${emailMatch ? '✅ Found' : '❌ Not found'}`);
      }
    }
    
  } catch (error) {
    console.error('Error testing credentials:', error);
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

// Run the test
testUserCredentials();