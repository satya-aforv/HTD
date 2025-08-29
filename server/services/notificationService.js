import Notification from '../models/Notification.js';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { logTwilioStatus } from '../utils/twilioHealthCheck.js';

class NotificationService {
  constructor() {
    // Email transporter setup
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // SMS client setup (Twilio)
    this.smsClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
      ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      : null;
    
    // Log Twilio configuration status on startup
    logTwilioStatus();
  }

  // Create notification
  async createNotification(notificationData) {
    if (!notificationData || !notificationData.recipient) {
      throw new Error('Invalid notification data: recipient is required');
    }

    try {
      const notification = new Notification(notificationData);
      await notification.save();

      // Send immediately if scheduled for now or past
      if (notification.shouldSend()) {
        await this.sendNotification(notification._id);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Send notification through enabled channels
  async sendNotification(notificationId) {
    try {
      if (!notificationId) {
        throw new Error('Notification ID is required');
      }

      const notification = await Notification.findById(notificationId)
        .populate('recipient', 'name email contactNumber preferences');

      if (!notification) {
        throw new Error('Notification not found');
      }

      if (!notification.shouldSend()) {
        return false;
      }

      const recipient = notification.recipient;
      if (!recipient) {
        throw new Error('Notification recipient not found');
      }
      let allChannelsSuccessful = true;

      // Send email
      if (notification.channels?.email?.enabled && recipient.email) {
        try {
          await this.sendEmail(notification, recipient);
          notification.channels.email.sent = true;
          notification.channels.email.sentAt = new Date();
        } catch (error) {
          console.error('Email sending failed:', error);
          notification.channels.email.error = error.message;
          allChannelsSuccessful = false;
        }
      }

      // Send SMS
      if (notification.channels?.sms?.enabled && recipient.contactNumber) {
        if (!this.smsClient) {
          console.warn('SMS channel enabled but Twilio not configured - skipping SMS');
          notification.channels.sms.error = 'SMS service not configured';
          notification.channels.sms.sent = false;
          // Don't mark as failed if SMS is not critical
        } else {
          try {
            await this.sendSMS(notification, recipient);
            notification.channels.sms.sent = true;
            notification.channels.sms.sentAt = new Date();
          } catch (error) {
            console.error('SMS sending failed:', error.message);
            notification.channels.sms.error = error.message;
            notification.channels.sms.sent = false;
            allChannelsSuccessful = false;
          }
        }
      }

      // Update notification status
      notification.status = allChannelsSuccessful ? 'SENT' : 'FAILED';
      await notification.save();

      return allChannelsSuccessful;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  // Send email notification
  async sendEmail(notification, recipient) {
    if (!notification || !recipient?.email) {
      throw new Error('Invalid notification or recipient email');
    }

    const emailTemplate = this.getEmailTemplate(notification);
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@htd-system.com',
      to: recipient.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    };

    await this.emailTransporter.sendMail(mailOptions);
  }

  // Send SMS notification
  async sendSMS(notification, recipient) {
    if (!this.smsClient) {
      console.warn('SMS service not configured - Twilio credentials missing');
      throw new Error('SMS service not configured - Twilio credentials missing');
    }

    if (!process.env.TWILIO_PHONE_NUMBER) {
      console.warn('TWILIO_PHONE_NUMBER not configured');
      throw new Error('TWILIO_PHONE_NUMBER not configured');
    }

    const message = this.getSMSMessage(notification);
    
    try {
      await this.smsClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: recipient.contactNumber,
      });
      console.log(`SMS sent successfully to ${recipient.contactNumber}`);
    } catch (error) {
      console.error('Twilio SMS sending failed:', error.message);
      throw new Error(`SMS sending failed: ${error.message}`);
    }
  }

  // Get email template based on notification type
  getEmailTemplate(notification) {
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    
    const templates = {
      TRAINING_PROGRESS: {
        subject: `Training Progress Update - ${notification.title}`,
        html: `
          <h2>Training Progress Update</h2>
          <p>Dear ${notification.recipient.name},</p>
          <p>${notification.message}</p>
          ${notification.actionUrl ? `<p><a href="${baseUrl}${notification.actionUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Details</a></p>` : ''}
          <p>Best regards,<br>HTD Training Team</p>
        `,
        text: `Training Progress Update\n\nDear ${notification.recipient.name},\n\n${notification.message}\n\n${notification.actionUrl ? `View details: ${baseUrl}${notification.actionUrl}\n\n` : ''}Best regards,\nHTD Training Team`
      },
      PAYMENT_REMINDER: {
        subject: `Payment Reminder - ${notification.title}`,
        html: `
          <h2>Payment Reminder</h2>
          <p>Dear ${notification.recipient.name},</p>
          <p>${notification.message}</p>
          ${notification.actionUrl ? `<p><a href="${baseUrl}${notification.actionUrl}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Process Payment</a></p>` : ''}
          <p>Best regards,<br>HTD Finance Team</p>
        `,
        text: `Payment Reminder\n\nDear ${notification.recipient.name},\n\n${notification.message}\n\n${notification.actionUrl ? `Process payment: ${baseUrl}${notification.actionUrl}\n\n` : ''}Best regards,\nHTD Finance Team`
      },
      EVALUATION_DUE: {
        subject: `Evaluation Due - ${notification.title}`,
        html: `
          <h2>Evaluation Due</h2>
          <p>Dear ${notification.recipient.name},</p>
          <p>${notification.message}</p>
          ${notification.actionUrl ? `<p><a href="${baseUrl}${notification.actionUrl}" style="background: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Complete Evaluation</a></p>` : ''}
          <p>Best regards,<br>HTD Training Team</p>
        `,
        text: `Evaluation Due\n\nDear ${notification.recipient.name},\n\n${notification.message}\n\n${notification.actionUrl ? `Complete evaluation: ${baseUrl}${notification.actionUrl}\n\n` : ''}Best regards,\nHTD Training Team`
      }
    };

    return templates[notification.type] || {
      subject: notification.title,
      html: `
        <h2>${notification.title}</h2>
        <p>Dear ${notification.recipient.name},</p>
        <p>${notification.message}</p>
        ${notification.actionUrl ? `<p><a href="${baseUrl}${notification.actionUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Details</a></p>` : ''}
        <p>Best regards,<br>HTD System</p>
      `,
      text: `${notification.title}\n\nDear ${notification.recipient.name},\n\n${notification.message}\n\n${notification.actionUrl ? `View details: ${baseUrl}${notification.actionUrl}\n\n` : ''}Best regards,\nHTD System`
    };
  }

  // Get SMS message
  getSMSMessage(notification) {
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    let message = `HTD: ${notification.title}\n${notification.message}`;
    
    if (notification.actionUrl) {
      message += `\nView: ${baseUrl}${notification.actionUrl}`;
    }
    
    // SMS character limit
    return message.length > 160 ? message.substring(0, 157) + '...' : message;
  }

  // Process scheduled notifications
  async processScheduledNotifications() {
    try {
      const pendingNotifications = await Notification.find({
        status: 'PENDING',
        scheduledFor: { $lte: new Date() },
        $or: [
          { 'channels.email.enabled': true },
          { 'channels.sms.enabled': true },
          { 'channels.inApp.enabled': true }
        ]
      }).populate('recipient', 'name email contactNumber');

      for (const notification of pendingNotifications) {
        if (!notification?._id) {
          console.warn('Skipping notification with missing ID');
          continue;
        }
        
        try {
          await this.sendNotification(notification._id);
        } catch (error) {
          console.error(`Failed to send notification ${notification._id}:`, error);
        }
      }

      return pendingNotifications.length;
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
      return 0;
    }
  }

  // Training progress notifications
  async notifyTrainingProgress(candidateId, trainingId, message, userId) {
    return this.createNotification({
      recipient: userId,
      type: 'TRAINING_PROGRESS',
      title: 'Training Progress Update',
      message,
      priority: 'MEDIUM',
      channels: {
        email: { enabled: true },
        sms: { enabled: false },
        inApp: { enabled: true }
      },
      relatedEntity: {
        entityType: 'TRAINING',
        entityId: trainingId
      },
      actionUrl: `/htd/trainings/${trainingId}`,
      createdBy: userId
    });
  }

  // Payment reminder notifications
  async notifyPaymentReminder(candidateId, amount, dueDate, userId) {
    return this.createNotification({
      recipient: userId,
      type: 'PAYMENT_REMINDER',
      title: 'Payment Reminder',
      message: `Payment of $${amount} is due on ${dueDate.toLocaleDateString()}`,
      priority: 'HIGH',
      channels: {
        email: { enabled: true },
        sms: { enabled: !!this.smsClient }, // Only enable SMS if Twilio is configured
        inApp: { enabled: true }
      },
      relatedEntity: {
        entityType: 'CANDIDATE',
        entityId: candidateId
      },
      actionUrl: `/htd/payments/new?candidateId=${candidateId}`,
      createdBy: userId
    });
  }

  // Evaluation due notifications
  async notifyEvaluationDue(trainingId, evaluatorId, candidateName) {
    return this.createNotification({
      recipient: evaluatorId,
      type: 'EVALUATION_DUE',
      title: 'Monthly Evaluation Due',
      message: `Monthly evaluation for ${candidateName} is due. Please complete the evaluation.`,
      priority: 'HIGH',
      channels: {
        email: { enabled: true },
        sms: { enabled: false },
        inApp: { enabled: true }
      },
      relatedEntity: {
        entityType: 'TRAINING',
        entityId: trainingId
      },
      actionUrl: `/htd/trainings/${trainingId}/evaluation`,
      scheduledFor: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
  }
}

export default new NotificationService();
