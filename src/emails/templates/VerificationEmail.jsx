import React from 'react';
import EmailLayout from './EmailLayout';

const VerificationEmail = ({ name, verificationLink }) => {
  return (
    <EmailLayout title="Verify Your Email">
      <h1 style={{ color: '#2C3E50', margin: '0 0 16px 0', fontSize: '24px', fontWeight: '600' }}>
        Welcome to HomeSwift, {name}!
      </h1>
      
      <p style={{ margin: '0 0 16px 0', color: '#4B5563' }}>
        Thank you for signing up! To complete your registration, please verify your email address by clicking the button below:
      </p>
      
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a 
          href={verificationLink} 
          className="button"
          style={{
            backgroundColor: '#FF6B35',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '16px',
            display: 'inline-block'
          }}
        >
          Verify Email Address
        </a>
      </div>
      
      <p style={{ margin: '16px 0', color: '#4B5563' }}>
        Or copy and paste this link into your browser:
      </p>
      
      <div style={{ 
        backgroundColor: '#F3F4F6', 
        padding: '12px 16px', 
        borderRadius: '6px',
        wordBreak: 'break-all',
        marginBottom: '24px',
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#1F2937'
      }}>
        {verificationLink}
      </div>
      
      <p style={{ margin: '16px 0 0 0', color: '#6B7280', fontSize: '14px' }}>
        If you didn't create an account with HomeSwift, you can safely ignore this email.
      </p>
    </EmailLayout>
  );
};

export default VerificationEmail;
