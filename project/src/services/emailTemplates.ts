import { BookingEmailData, PasswordResetData } from './emailService';

export class EmailTemplates {
  static bookingConfirmationHTML(data: BookingEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: #f9f9f9; padding: 30px; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .detail-row { display: flex; justify-content: space-between; margin: 12px 0; }
            .detail-label { font-weight: 600; color: #667eea; }
            .detail-value { text-align: right; }
            .footer { background: #f0f0f0; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .status-badge { display: inline-block; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; }
            .status-confirmed { background: #d4edda; color: #155724; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Confirmed!</h1>
              <p>Your consultation session has been successfully booked</p>
            </div>
            <div class="content">
              <p>Hi <strong>${data.clientName}</strong>,</p>
              <p>Your booking with <strong>${data.consultantName}</strong> has been confirmed. Here are your session details:</p>

              <div class="booking-details">
                <div class="detail-row">
                  <span class="detail-label">Booking ID:</span>
                  <span class="detail-value">${data.bookingId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Consultant:</span>
                  <span class="detail-value">${data.consultantName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${new Date(data.bookingDate).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time:</span>
                  <span class="detail-value">${data.bookingTime}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Duration:</span>
                  <span class="detail-value">${data.duration} minutes</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Topic:</span>
                  <span class="detail-value">${data.topic}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Amount:</span>
                  <span class="detail-value">${data.currency} ${data.amount.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Payment Status:</span>
                  <span class="detail-value"><span class="status-badge status-confirmed">${data.paymentStatus}</span></span>
                </div>
              </div>

              <p>A confirmation link has been sent to the consultant. You will receive further details about how to join the session closer to the scheduled time.</p>

              <p>If you need to reschedule or cancel, please contact support at least 24 hours before your scheduled session.</p>

              <p>Best regards,<br><strong>The Consultation Platform Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this address.</p>
              <p>&copy; 2026 Consultation Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static consultantNotificationHTML(data: BookingEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: #f9f9f9; padding: 30px; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
            .detail-row { display: flex; justify-content: space-between; margin: 12px 0; }
            .detail-label { font-weight: 600; color: #28a745; }
            .detail-value { text-align: right; }
            .footer { background: #f0f0f0; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
            .action-button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Booking Request</h1>
              <p>You have a new consultation session booked</p>
            </div>
            <div class="content">
              <p>Hi <strong>${data.consultantName}</strong>,</p>
              <p>Great news! A new client has booked a consultation session with you. Here are the details:</p>

              <div class="booking-details">
                <div class="detail-row">
                  <span class="detail-label">Booking ID:</span>
                  <span class="detail-value">${data.bookingId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Client:</span>
                  <span class="detail-value">${data.clientName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Client Email:</span>
                  <span class="detail-value">${data.clientEmail}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${new Date(data.bookingDate).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time:</span>
                  <span class="detail-value">${data.bookingTime}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Duration:</span>
                  <span class="detail-value">${data.duration} minutes</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Topic:</span>
                  <span class="detail-value">${data.topic}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Amount:</span>
                  <span class="detail-value">${data.currency} ${data.amount.toFixed(2)}</span>
                </div>
              </div>

              <p>Payment has been received. Please prepare your materials and ensure you're available at the scheduled time.</p>

              <p>Best regards,<br><strong>The Consultation Platform Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this address.</p>
              <p>&copy; 2026 Consultation Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static passwordResetHTML(data: PasswordResetData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: #f9f9f9; padding: 30px; }
            .alert { background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .reset-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { background: #f0f0f0; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
            .expiry { color: #dc3545; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p>We received a request to reset your password. Click the button below to reset it:</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.resetLink}" class="reset-button">Reset Password</a>
              </div>

              <div class="alert">
                <strong>Important:</strong> This link is valid for 24 hours only. After that, you'll need to request a new password reset.
              </div>

              <p>If you didn't request this password reset, you can safely ignore this email. Your password will not be changed unless you click the link above.</p>

              <p>For security reasons, never share this link with anyone else.</p>

              <p>Best regards,<br><strong>The Consultation Platform Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this address.</p>
              <p>&copy; 2026 Consultation Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static bookingConfirmationText(data: BookingEmailData): string {
    return `
Booking Confirmed!

Hi ${data.clientName},

Your booking with ${data.consultantName} has been confirmed.

Session Details:
- Booking ID: ${data.bookingId}
- Consultant: ${data.consultantName}
- Date: ${new Date(data.bookingDate).toLocaleDateString()}
- Time: ${data.bookingTime}
- Duration: ${data.duration} minutes
- Topic: ${data.topic}
- Amount: ${data.currency} ${data.amount.toFixed(2)}
- Payment Status: ${data.paymentStatus}

A confirmation link has been sent to the consultant. You will receive further details about how to join the session closer to the scheduled time.

If you need to reschedule or cancel, please contact support at least 24 hours before your scheduled session.

Best regards,
The Consultation Platform Team
    `;
  }

  static passwordResetText(data: PasswordResetData): string {
    return `
Password Reset Request

Hi there,

We received a request to reset your password. Copy the link below into your browser to reset it:

${data.resetLink}

This link is valid for 24 hours only.

If you didn't request this password reset, you can safely ignore this email.

Best regards,
The Consultation Platform Team
    `;
  }
}
