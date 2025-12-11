// Basic email service for password reset functionality
import nodemailer from 'nodemailer';

// For development, we'll use a simple console-based email service
// In production, you would configure with real SMTP settings
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production email configuration
    return nodemailer.createTransporter({
      service: 'gmail', // or your preferred email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Development: Use ethereal email for testing
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass',
      },
    });
  }
};

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  try {
    const transporter = createTransporter();
    
    const resetURL = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@vietravel.com',
      to: email,
      subject: 'Đặt lại mật khẩu - Vietravel',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Đặt lại mật khẩu</h2>
          <p>Xin chào,</p>
          <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Vietravel của mình.</p>
          <p>Vui lòng nhấp vào liên kết bên dưới để đặt lại mật khẩu:</p>
          <a href="${resetURL}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
            Đặt lại mật khẩu
          </a>
          <p>Liên kết này sẽ hết hạn sau 10 phút.</p>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Đây là email tự động, vui lòng không trả lời email này.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    // In development, log the email details
    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Email sent (development mode):');
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      console.log('Reset URL:', resetURL);
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Không thể gửi email đặt lại mật khẩu');
  }
};

export default {
  sendPasswordResetEmail,
};
