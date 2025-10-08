import React from 'react';
import EmailLayout from './EmailLayout';

const WelcomeEmail = ({ name, userType, dashboardLink }) => {
  const isLandlord = userType === 'landlord';
  
  return (
    <EmailLayout title="Welcome to HomeSwift!">
      <h1 style={{ color: '#2C3E50', margin: '0 0 16px 0', fontSize: '24px', fontWeight: '600' }}>
        Welcome to HomeSwift, {name}! 🎉
      </h1>
      
      <p style={{ margin: '0 0 16px 0', color: '#4B5563' }}>
        We're thrilled to have you on board! Your {isLandlord ? 'landlord' : 'renter'} account has been successfully created and is ready to use.
      </p>
      
      {isLandlord ? (
        <>
          <p style={{ margin: '0 0 16px 0', color: '#4B5563' }}>
            As a landlord, you can now:
          </p>
          <ul style={{ margin: '0 0 24px 0', paddingLeft: '24px', color: '#4B5563' }}>
            <li style={{ marginBottom: '8px' }}>List your properties with detailed descriptions and images</li>
            <li style={{ marginBottom: '8px' }}>Manage inquiries and schedule viewings</li>
            <li style={{ marginBottom: '8px' }}>Track your property performance with our analytics dashboard</li>
          </ul>
        </>
      ) : (
        <>
          <p style={{ margin: '0 0 16px 0', color: '#4B5563' }}>
            As a renter, you can now:
          </p>
          <ul style={{ margin: '0 0 24px 0', paddingLeft: '24px', color: '#4B5563' }}>
            <li style={{ marginBottom: '8px' }}>Browse and save your favorite properties</li>
            <li style={{ marginBottom: '8px' }}>Schedule viewings with landlords</li>
            <li style={{ marginBottom: '8px' }}>Get personalized property recommendations</li>
          </ul>
        </>
      )}
      
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a 
          href={dashboardLink} 
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
          Go to {isLandlord ? 'Dashboard' : 'Browse Properties'}
        </a>
      </div>
      
      <div style={{ 
        backgroundColor: '#F3F4F6', 
        padding: '16px', 
        borderRadius: '8px',
        margin: '24px 0',
        borderLeft: '4px solid #FF6B35'
      }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#2C3E50', fontSize: '16px' }}>
          Getting Started
        </h3>
        <p style={{ margin: '0', color: '#4B5563', fontSize: '14px' }}>
          Complete your profile to {isLandlord ? 'start listing properties' : 'get better property matches'}.
        </p>
      </div>
      
      <p style={{ margin: '24px 0 0 0', color: '#4B5563' }}>
        If you have any questions, feel free to reply to this email or contact our support team at support@homeswift.co.
      </p>
      
      <p style={{ margin: '16px 0 0 0', color: '#6B7280', fontSize: '14px' }}>
        Happy {isLandlord ? 'hosting' : 'house hunting'}!<br />
        The HomeSwift Team
      </p>
    </EmailLayout>
  );
};

export default WelcomeEmail;
