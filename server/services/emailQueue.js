import Queue from 'bee-queue';
import { sendEmail } from './emailService.js';

// In-memory queue for development
let emailQueue;

if (!global.emailQueue) {
  // Create an in-memory queue (no Redis needed)
  global.emailQueue = new Queue('email', {
    isWorker: true,
    removeOnSuccess: true,
    removeOnFailure: false,
    redis: {
      // Use in-memory store (not for production)
      host: '127.0.0.1',
      port: 0, // 0 means use in-memory
      db: 0,
      options: {}
    },
    settings: {
      // Process one job at a time
      maxStalledCount: 1,
      retryProcessDelay: 1000,
      // No need for retries in development
      retryDelays: []
    }
  });

  // Process jobs from the queue
  global.emailQueue.process(async (job) => {
    const { to, templateName, templateData } = job.data;
    console.log(`Processing email to ${to}...`);
    
    try {
      const result = await sendEmail(to, templateName, templateData);
      
      if (!result.success) {
        console.error(`Failed to send email to ${to}:`, result.error);
        throw new Error(result.error);
      }
      
      console.log(`Email sent to ${to}`);
      return result;
    } catch (error) {
      console.error(`Error sending email to ${to}:`, error);
      throw error;
    }
  });

  // Handle queue events
  global.emailQueue.on('ready', () => {
    console.log('Email queue is ready');
  });

  global.emailQueue.on('error', (error) => {
    console.error('Queue error:', error);
  });

  global.emailQueue.on('succeeded', (job, result) => {
    console.log(`Job ${job.id} succeeded with result:`, result);
  });

  global.emailQueue.on('failed', (job, error) => {
    console.error(`Job ${job.id} failed:`, error);
  });
}

emailQueue = global.emailQueue;

// Function to add email to queue
const addToEmailQueue = (to, templateName, templateData) => {
  const job = emailQueue.createJob({
    to,
    templateName,
    templateData: {
      ...templateData,
      timestamp: new Date().toISOString(),
    },
  });

  return new Promise((resolve, reject) => {
    job.save()
      .then((job) => {
        console.log(`Added email job ${job.id} to queue`);
        resolve(job);
      })
      .catch((error) => {
        console.error('Error adding job to queue:', error);
        reject(error);
      });
  });
};

// Export the queue instance and addToEmailQueue function
export { emailQueue, addToEmailQueue };
