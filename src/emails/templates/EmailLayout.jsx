import React from 'react';

const EmailLayout = ({ children, title }) => {
  return (
    <html>
      <head>
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            body {
              margin: 0;
              padding: 0;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.5;
              color: #2C3E50;
              background-color: #f9fafb;
            }
            
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            
            .email-header {
              background-color: #2C3E50;
              padding: 24px;
              text-align: center;
            }
            
            .logo {
              color: #ffffff;
              font-size: 24px;
              font-weight: 700;
              text-decoration: none;
              display: inline-block;
              margin-bottom: 16px;
            }
            
            .email-content {
              padding: 32px;
            }
            
            .email-footer {
              background-color: #f3f4f6;
              padding: 20px 32px;
              text-align: center;
              font-size: 14px;
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
            }
            
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #FF6B35;
              color: #ffffff;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 16px 0;
              transition: background-color 0.2s ease;
            }
            
            .button:hover {
              background-color: #e65a28;
            }
            
            .divider {
              height: 1px;
              background-color: #e5e7eb;
              margin: 24px 0;
            }
            
            @media only screen and (max-width: 600px) {
              .email-container {
                width: 100% !important;
                border-radius: 0;
              }
              
              .email-content {
                padding: 24px 16px;
              }
            }
          `}
        </style>
      </head>
      <body>
        <div className="email-container">
          <div className="email-header">
            <a href="https://homeswift.co" className="logo">HomeSwift</a>
          </div>
          <div className="email-content">
            {children}
          </div>
          <div className="email-footer">
            <p>© {new Date().getFullYear()} HomeSwift. All rights reserved.</p>
            <p>
              <a href="https://homeswift.co/privacy" style={{color: '#6b7280', textDecoration: 'underline'}}>Privacy Policy</a> 
              • 
              <a href="https://homeswift.co/terms" style={{color: '#6b7280', textDecoration: 'underline'}}>Terms of Service</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};

export default EmailLayout;
