import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create a nodemailer transport using Supabase SMTP
const createTransporter = async () => {
  try {
    // Get SMTP settings from Supabase
    const { data: settings, error } = await supabase
      .from("smtp_settings")
      .select("*")
      .single();

    if (error || !settings) {
      console.error(
        "Error fetching SMTP settings:",
        error ? error.message : "No SMTP settings found"
      );
      throw new Error("Failed to load SMTP configuration");
    }

    return nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: {
        user: settings.username,
        pass: settings.password,
      },
      tls: {
        rejectUnauthorized: false, // Only for development with self-signed certs
      },
    });
  } catch (error) {
    console.error("Error creating transporter:", error);
    throw error;
  }
};

// Email template function
const emailTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HomeSwift Email</title>
    <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Raleway', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #2C3E50;
            margin: 0;
            padding: 20px 10px;
            background-color: #f8fafc;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
        }
        .header {
            background: #FF6B35;
            padding: 40px 20px 30px;
            text-align: center;
            position: relative;
        }
        .logo-container {
            background: #ffffff;
            display: inline-block;
            padding: 15px 25px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            margin-bottom: 25px;
        }
        .logo {
            height: 32px;
            width: auto;
        }
        .content {
            padding: 40px 35px;
            color: #2C3E50;
            line-height: 1.7;
            font-size: 15px;
        }
        h1, h2, h3 {
            color: #2C3E50;
            margin-top: 0;
            line-height: 1.3;
            font-weight: 700;
        }
        h2 {
            font-size: 24px;
            margin-bottom: 20px;
        }
        .button {
            display: inline-block;
            padding: 14px 28px;
            background: #FF6B35;
            color: white !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 15px;
            margin: 25px 0;
            transition: all 0.2s ease;
            box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
            text-align: center;
            min-width: 180px;
        }
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
        }
        .footer {
            text-align: center;
            padding: 25px;
            font-size: 13px;
            color: #2C3E50;
            border-top: 1px solid #e2e8f0;
            background-color: #f8fafc;
        }
        .text-muted {
            color: #85929E;
            font-size: 13px;
            margin: 8px 0 0;
            line-height: 1.5;
        }
        .divider {
            height: 1px;
            background: linear-gradient(90deg, #EBEDEF 0%, #D5D8DC 50%, #EBEDEF 100%);
            margin: 30px 0;
            border: none;
        }
        @media (max-width: 480px) {
            .content {
                padding: 30px 20px;
            }
            .button {
                width: 100%;
                padding: 14px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo-container">
                <img src="https://homeswift.co/logo.png" alt="HomeSwift Logo" class="logo">
            </div>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} HomeSwift. All rights reserved.</p>
            <p class="text-muted">
                This is an automated message, please do not reply directly to this email.<br>
                <a href="#" style="color: #2C3E50; text-decoration: underline;">Unsubscribe</a> • 
                <a href="https://homeswift.co/privacy" style="color: #2C3E50; text-decoration: underline;">Privacy Policy</a> • 
                <a href="https://homeswift.co/terms" style="color: #2C3E50; text-decoration: underline;">Terms</a>
            </p>
        </div>
    </div>
</body>
</html>`;

// Email templates
const templates = {
  verification: (data) => {
    return emailTemplate(`
      <h2>Verify Your Email Address</h2>
      <p>Hello <strong>${data.name}</strong>,</p>
      <p>Please verify your email address by clicking the button below:</p>
      <p><a href="${data.verificationLink}" class="button">Verify Email</a></p>
      <p>Or copy and paste this link into your browser:</p>
      <p>${data.verificationLink}</p>
      <p>If you did not create an account, you can safely ignore this email.</p>
    `);
  },

  welcome: (data) => {
    return emailTemplate(`
      <h2>Welcome to HomeSwift, ${data.name}!</h2>
      <p>Thank you for joining HomeSwift as a ${data.userType}.</p>
      <p><a href="${data.dashboardLink}" class="button">Go to Dashboard</a></p>
      <p>If you have any questions, please contact our support team.</p>
    `);
  },

  passwordReset: (data) => {
    return emailTemplate(`
      <h2>Reset Your Password</h2>
      <p>Hello ${data.name},</p>
      <p>Click the button below to reset your password:</p>
      <p><a href="${data.resetLink}" class="button">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
    `);
  },
};

// Import the queue
import { addToEmailQueue } from './emailQueue.js';

// Email sending function (used by the queue)
export const sendEmail = async (to, templateName, templateData) => {
  try {
    const transporter = await createTransporter();
    const template = templates[templateName];

    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    const html = template(templateData);
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "HomeSwift"}" <${
        process.env.EMAIL_FROM_EMAIL || "noreply@homeswift.co"
      }>`,
      to,
      subject: templateData.subject || "Message from HomeSwift",
      html,
      text: html.replace(/<[^>]*>?/gm, ""), // Basic HTML to text conversion
    };

    const info = await transporter.sendMail(mailOptions);

    // Log the email in the database
    await supabase.from("email_logs").insert([
      {
        to_email: to,
        subject: templateData.subject || "No subject",
        template: templateName,
        message_id: info.messageId,
        status: "sent",
        created_at: new Date().toISOString(),
      },
    ]);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);

    // Log the error in the database
    try {
      await supabase.from("email_logs").insert([
        {
          to_email: to,
          subject: templateData?.subject || "Error",
          template: templateName,
          error: error.message,
          status: "failed",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (dbError) {
      console.error("Error logging email failure:", dbError);
    }

    return { success: false, error: error.message };
  }
};

// Export the email queue functions
export const sendVerificationEmail = (to, name, verificationLink) =>
  addToEmailQueue(to, "verification", {
    name,
    verificationLink,
    subject: "Verify Your Email - HomeSwift",
  });

export const sendWelcomeEmail = (to, name, userType, dashboardLink) =>
  addToEmailQueue(to, "welcome", {
    name,
    userType,
    dashboardLink,
    subject: `Welcome to HomeSwift, ${name}!`,
  });

export const sendPasswordResetEmail = (to, name, resetLink) =>
  addToEmailQueue(to, "passwordReset", {
    name,
    resetLink,
    subject: "Password Reset Request - HomeSwift",
  });
