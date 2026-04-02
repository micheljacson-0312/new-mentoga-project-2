import { supabase } from '@/lib/supabase';

export interface BookingEmailData {
  bookingId: string;
  consultantName: string;
  consultantEmail: string;
  clientName: string;
  clientEmail: string;
  bookingDate: string;
  bookingTime: string;
  duration: number;
  topic: string;
  amount: number;
  currency: string;
  paymentStatus: string;
}

export interface PasswordResetData {
  email: string;
  resetLink: string;
}

export class EmailService {
  private static apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`;

  static async sendBookingConfirmation(data: BookingEmailData): Promise<void> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'booking_confirmation',
          data,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send booking confirmation email');
      }
    } catch (error) {
      console.error('Error sending booking confirmation email:', error);
      throw error;
    }
  }

  static async sendPasswordResetEmail(data: PasswordResetData): Promise<void> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'password_reset',
          data,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send password reset email');
      }
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  static async sendConsultantNotification(data: BookingEmailData): Promise<void> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'consultant_notification',
          data,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send consultant notification email');
      }
    } catch (error) {
      console.error('Error sending consultant notification email:', error);
      throw error;
    }
  }
}
