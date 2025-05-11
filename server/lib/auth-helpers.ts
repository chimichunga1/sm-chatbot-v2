import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

/**
 * Hashes a password with a random salt
 * @param password The password to hash
 * @returns A string in the format "hash.salt"
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

/**
 * Compares a plaintext password with a stored hash
 * Support two formats: "hash.salt" (standard) or "salt.hash" (used in fix scripts)
 * @param supplied The plaintext password to check
 * @param stored The stored password hash
 * @returns True if the passwords match, false otherwise
 */
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  // Check if the stored hash contains a dot
  if (!stored.includes('.')) {
    console.error('Invalid hash format - no separator found');
    return false;
  }
  
  // Split the stored hash by the dot
  const parts = stored.split('.');
  if (parts.length !== 2) {
    console.error('Invalid hash format - wrong number of parts');
    return false;
  }
  
  let salt: string;
  let hash: string;
  
  // Try to detect the format
  // If first part is 128 chars and second is 32, it's likely hash.salt format
  // If first part is 32 chars and second is 128, it's likely salt.hash format
  if (parts[0].length > parts[1].length) {
    // Format is likely hash.salt (standard format)
    [hash, salt] = parts;
    console.log('Detected hash.salt format (standard)');
  } else {
    // Format is likely salt.hash (used in fix scripts)
    [salt, hash] = parts;
    console.log('Detected salt.hash format (from fix scripts)');
  }
  
  try {
    const hashedBuf = Buffer.from(hash, 'hex');
    const suppliedBuf = (await scryptAsync(supplied, salt, hashedBuf.length)) as Buffer;
    
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}