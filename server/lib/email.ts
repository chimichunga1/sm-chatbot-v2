import * as mailgun from 'mailgun-js';

// Email sending options interface
export interface EmailOptions {
  to: string; 
  from: string;
  subject: string;
  html?: string;
  text?: string;
}

/**
 * Specialized options for password reset emails
 */
export interface PasswordResetEmailOptions {
  to: string;
  username: string;
  resetToken: string;
  resetUrl: string;
}

/**
 * Send an email using Mailgun
 * 
 * @param options Email options including to, from, subject, and content
 * @returns A promise that resolves when the email is sent
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Check if Mailgun API key is configured
    if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
      // For development, log to console
      console.log('=============================================');
      console.log('DEVELOPMENT EMAIL (Mailgun not configured):');
      console.log('To:', options.to);
      console.log('From:', options.from);
      console.log('Subject:', options.subject);
      console.log('Content:', options.html || options.text);
      console.log('=============================================');
      return true;
    }

    // Initialize Mailgun with API key and domain
    const mg = mailgun({
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN
    });

    // Prepare email data
    const data = {
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || convertHtmlToText(options.html || '')
    };

    // Send the email
    await mg.messages().send(data);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Simple utility to convert HTML to plain text for email
 * This is a very basic implementation and doesn't handle all HTML elements
 * 
 * @param html HTML content to convert
 * @returns Plain text version of the HTML
 */
function convertHtmlToText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Send a password reset email to a user
 * 
 * @param options Options for the password reset email
 * @returns A promise that resolves to a boolean indicating success or failure
 */
export async function sendPasswordResetEmail(options: PasswordResetEmailOptions): Promise<boolean> {
  const appName = process.env.APP_NAME || 'PriceBetter.ai';
  const senderEmail = process.env.SYSTEM_EMAIL || 'noreply@pricebetter.ai';
  
  // Create HTML content for the email
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
        <h1 style="color: #333;">${appName}</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e9ecef; border-top: none;">
        <p>Hello ${options.username},</p>
        <p>We received a request to reset your password. If you didn't make this request, you can ignore this email.</p>
        <p>To reset your password, click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${options.resetUrl}" 
             style="background-color: #000; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #0066cc;">${options.resetUrl}</p>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>Thank you,<br>The ${appName} Team</p>
      </div>
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #6c757d;">
        <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
      </div>
    </div>
  `;

  // Plain text version
  const text = `
Hello ${options.username},

We received a request to reset your password. If you didn't make this request, you can ignore this email.

To reset your password, visit the following link:
${options.resetUrl}

This link will expire in 1 hour for security reasons.

Thank you,
The ${appName} Team

If you didn't request a password reset, please ignore this email or contact support if you have concerns.
  `;

  // Send the email
  return sendEmail({
    to: options.to,
    from: `${appName} <${senderEmail}>`,
    subject: 'Reset Your Password',
    html,
    text
  });
}