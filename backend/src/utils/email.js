const nodemailer = require('nodemailer');
const config = require('../config');

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.password
  }
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: config.email.from,
      to,
      subject,
      html,
      text
    });
    
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
};

const sendOTPEmail = async (email, otp, fullName) => {
  const subject = 'BidHub - Xác nhận đăng ký tài khoản';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Xin chào ${fullName},</h2>
      <p>Cảm ơn bạn đã đăng ký tài khoản tại BidHub!</p>
      <p>Mã OTP của bạn là:</p>
      <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
        ${otp}
      </div>
      <p>Mã OTP này có hiệu lực trong ${config.otp.expiresInMinutes} phút.</p>
      <p>Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        Email này được gửi tự động, vui lòng không reply.<br>
        © 2025 BidHub. All rights reserved.
      </p>
    </div>
  `;
  
  const text = `Xin chào ${fullName},\n\nMã OTP của bạn là: ${otp}\n\nMã có hiệu lực trong ${config.otp.expiresInMinutes} phút.`;
  
  return sendEmail({ to: email, subject, html, text });
};

const sendPasswordResetEmail = async (email, otp, fullName) => {
  const subject = 'BidHub - Khôi phục mật khẩu';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Xin chào ${fullName},</h2>
      <p>Bạn đã yêu cầu khôi phục mật khẩu tài khoản BidHub.</p>
      <p>Mã OTP xác nhận của bạn là:</p>
      <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
        ${otp}
      </div>
      <p>Mã OTP này có hiệu lực trong ${config.otp.expiresInMinutes} phút.</p>
      <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        Email này được gửi tự động, vui lòng không reply.<br>
        © 2025 BidHub. All rights reserved.
      </p>
    </div>
  `;
  
  const text = `Xin chào ${fullName},\n\nMã OTP khôi phục mật khẩu: ${otp}\n\nMã có hiệu lực trong ${config.otp.expiresInMinutes} phút.`;
  
  return sendEmail({ to: email, subject, html, text });
};

const sendQuestionNotificationEmail = async (sellerEmail, sellerName, productTitle, productId, question, askerName) => {
  const productLink = `${config.frontendUrl}/products/${productId}`;
  const subject = `BidHub - Câu hỏi mới về sản phẩm "${productTitle}"`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Xin chào ${sellerName},</h2>
      <p>Bạn có một câu hỏi mới về sản phẩm <strong>${productTitle}</strong>:</p>
      
      <div style="background-color: #f9f9f9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #666; font-size: 14px;"><strong>Người hỏi:</strong> ${askerName}</p>
        <p style="margin: 10px 0 0 0; font-size: 15px; line-height: 1.5;">${question}</p>
      </div>
      
      <p>Vui lòng trả lời câu hỏi của khách hàng để tăng cơ hội bán được sản phẩm.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${productLink}" 
           style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Xem chi tiết và trả lời
        </a>
      </div>
      
      <p style="color: #666; font-size: 13px;">Hoặc copy link sau vào trình duyệt:<br>
        <a href="${productLink}" style="color: #4CAF50;">${productLink}</a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        Email này được gửi tự động, vui lòng không reply.<br>
        © 2025 BidHub. All rights reserved.
      </p>
    </div>
  `;
  
  const text = `Xin chào ${sellerName},\n\nBạn có câu hỏi mới về sản phẩm "${productTitle}":\n\nNgười hỏi: ${askerName}\nCâu hỏi: ${question}\n\nTrả lời tại: ${productLink}`;
  
  return sendEmail({ to: sellerEmail, subject, html, text });
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendQuestionNotificationEmail
};
