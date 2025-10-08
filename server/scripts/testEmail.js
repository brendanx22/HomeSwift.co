require('dotenv').config({ path: '../.env' });
const emailService = require('../services/emailService');

async function testEmail() {
  console.log('Sending test email...');
  
  try {
    // Test verification email
    const verificationResult = await emailService.sendVerificationEmail(
      'test@example.com',
      'Test User',
      'https://homeswift.co/verify-email?token=test123'
    );
    console.log('Verification email result:', verificationResult);

    // Test welcome email
    const welcomeResult = await emailService.sendWelcomeEmail(
      'test@example.com',
      'Test User',
      'landlord',
      'https://homeswift.co/landlord/dashboard'
    );
    console.log('Welcome email result:', welcomeResult);

    // Test password reset email
    const resetResult = await emailService.sendPasswordResetEmail(
      'test@example.com',
      'Test User',
      'https://homeswift.co/reset-password?token=test123'
    );
    console.log('Password reset email result:', resetResult);
    
  } catch (error) {
    console.error('Error sending test emails:', error);
  }
}

testEmail();
