import React from 'react';
import EmailLayout from './EmailLayout';

const PasswordResetEmail = ({ name, resetLink }) => {
  return (
    <EmailLayout title="Reset Your Password">
      <h1 style={{ color: '#2C3E50', margin: '0 0 16px 0', fontSize: '24px', fontWeight: '600' }}>
        Reset Your Password
      </h1>
      
      <p style={{ margin: '0 0 16px 0', color: '#4B5563' }}>
        Hello {name},
      </p>
      
      <p style={{ margin: '0 0 16px 0', color: '#4B5563' }}>
        We received a request to reset your password. Click the button below to choose a new password:
      </p>
      
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a 
          href={resetLink} 
          className="button"
          style={{
            backgroundColor: '#2C3E50',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '16px',
            display: 'inline-block'
          }}
        >
          Reset Password
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
        {resetLink}
      </div>
      
      <p style={{ margin: '16px 0 0 0', color: '#6B7280', fontSize: '14px' }}>
        This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have questions.
      </p>
    </EmailLayout>
  );
};

export default PasswordResetEmail;
