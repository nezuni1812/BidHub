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
  const subject = 'Bido - Xác nhận đăng ký tài khoản';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Xin chào ${fullName},</h2>
      <p>Cảm ơn bạn đã đăng ký tài khoản tại Bido!</p>
      <p>Mã OTP của bạn là:</p>
      <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
        ${otp}
      </div>
      <p>Mã OTP này có hiệu lực trong ${config.otp.expiresInMinutes} phút.</p>
      <p>Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        Email này được gửi tự động, vui lòng không reply.<br>
        © 2025 Bido. All rights reserved.
      </p>
    </div>
  `;
  
  const text = `Xin chào ${fullName},\n\nMã OTP của bạn là: ${otp}\n\nMã có hiệu lực trong ${config.otp.expiresInMinutes} phút.`;
  
  return sendEmail({ to: email, subject, html, text });
};

const sendPasswordResetEmail = async (email, otp, fullName, newPassword = null) => {
  let subject, html, text;

  if (newPassword) {
    subject = 'Bido - Mật khẩu của bạn đã được đặt lại';

    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Xin chào ${fullName},</h2>
        <p>Quản trị viên đã đặt lại mật khẩu cho tài khoản Bido của bạn.</p>
        <p><strong>Mật khẩu mới của bạn là:</strong></p>
        <div style="background-color: #fff3cd; padding: 20px; text-align: center; font-size: 26px; font-weight: bold; letter-spacing: 3px; margin: 20px 0; border: 2px dashed #ffc107; border-radius: 8px;">
          ${newPassword}
        </div>
        <p><strong>Vui lòng đăng nhập ngay và thay đổi mật khẩu mới để bảo mật tài khoản.</strong></p>
        <p>Nếu bạn không yêu cầu thay đổi này, vui lòng liên hệ hỗ trợ ngay lập tức.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          Email này được gửi tự động từ hệ thống quản trị.<br>
          © 2025 Bido. All rights reserved.
        </p>
      </div>
    `;

    text = `Xin chào ${fullName},\n\nMật khẩu tài khoản Bido của bạn đã được quản trị viên đặt lại.\n\nMật khẩu mới: ${newPassword}\n\nVui lòng đăng nhập và thay đổi mật khẩu ngay lập tức.\n\nNếu bạn không yêu cầu, hãy liên hệ hỗ trợ ngay.`;
  } else {
    subject = 'Bido - Khôi phục mật khẩu';
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Xin chào ${fullName},</h2>
        <p>Bạn đã yêu cầu khôi phục mật khẩu tài khoản Bido.</p>
        <p>Mã OTP xác nhận của bạn là:</p>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>Mã OTP này có hiệu lực trong ${config.otp.expiresInMinutes} phút.</p>
        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          Email này được gửi tự động, vui lòng không reply.<br>
          © 2025 Bido. All rights reserved.
        </p>
      </div>
    `;
    
    text = `Xin chào ${fullName},\n\nMã OTP khôi phục mật khẩu: ${otp}\n\nMã có hiệu lực trong ${config.otp.expiresInMinutes} phút.`;
  }

  return sendEmail({ to: email, subject, html, text });
};

const sendQuestionNotificationEmail = async (sellerEmail, sellerName, productTitle, productId, question, askerName) => {
  const productLink = `${config.frontendUrl}/product/${productId}`;
  const subject = `Bido - Câu hỏi mới về sản phẩm "${productTitle}"`;
  
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
        © 2025 Bido. All rights reserved.
      </p>
    </div>
  `;
  
  const text = `Xin chào ${sellerName},\n\nBạn có câu hỏi mới về sản phẩm "${productTitle}":\n\nNgười hỏi: ${askerName}\nCâu hỏi: ${question}\n\nTrả lời tại: ${productLink}`;
  
  return sendEmail({ to: sellerEmail, subject, html, text });
};

// Bid placed - notify seller, new bidder, previous bidder
const sendBidPlacedEmail = async (toEmail, userName, productTitle, productId, bidPrice, isOutbid = false) => {
  const productLink = `${config.frontendUrl}/product/${productId}`;
  const subject = isOutbid 
    ? `Bido - Bạn đã bị trả giá cho "${productTitle}"`
    : `Bido - Có lượt đặt giá mới cho "${productTitle}"`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${isOutbid ? '#f44336' : '#4CAF50'};">Xin chào ${userName},</h2>
      ${isOutbid 
        ? `<p>Có người đã đặt giá cao hơn bạn cho sản phẩm <strong>${productTitle}</strong>.</p>`
        : `<p>Có lượt đặt giá mới cho sản phẩm <strong>${productTitle}</strong>.</p>`
      }
      
      <div style="background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px;">
        <p style="margin: 0; font-size: 16px;"><strong>Giá hiện tại:</strong></p>
        <p style="margin: 10px 0 0 0; font-size: 24px; color: #4CAF50; font-weight: bold;">
          ${bidPrice.toLocaleString('vi-VN')} VND
        </p>
      </div>
      
      ${isOutbid 
        ? `<p>Đặt giá cao hơn ngay để giữ vị trí dẫn đầu!</p>`
        : `<p>Theo dõi cuộc đấu giá để cập nhật giá mới nhất.</p>`
      }
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${productLink}" 
           style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Xem sản phẩm
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        Email này được gửi tự động, vui lòng không reply.<br>
        © 2025 Bido. All rights reserved.
      </p>
    </div>
  `;
  
  const text = `${subject}\n\nGiá hiện tại: ${bidPrice.toLocaleString('vi-VN')} VND\n\nXem tại: ${productLink}`;
  return sendEmail({ to: toEmail, subject, html, text });
};

// Bidder denied
const sendBidderDeniedEmail = async (bidderEmail, bidderName, productTitle, productId, reason) => {
  const subject = `Bido - Bạn đã bị từ chối đấu giá "${productTitle}"`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f44336;">Xin chào ${bidderName},</h2>
      <p>Rất tiếc, người bán đã từ chối cho bạn tham gia đấu giá sản phẩm <strong>${productTitle}</strong>.</p>
      
      ${reason ? `
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>Lý do:</strong> ${reason}</p>
        </div>
      ` : ''}
      
      <p>Bạn có thể tìm các sản phẩm tương tự khác trên Bido.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${config.frontendUrl}/products" 
           style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Khám phá sản phẩm khác
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        Email này được gửi tự động, vui lòng không reply.<br>
        © 2025 Bido. All rights reserved.
      </p>
    </div>
  `;
  
  const text = `${subject}\n\n${reason ? `Lý do: ${reason}\n\n` : ''}Tìm sản phẩm khác tại: ${config.frontendUrl}/products`;
  return sendEmail({ to: bidderEmail, subject, html, text });
};

// Auction ended - no winner
const sendAuctionEndedNoWinnerEmail = async (sellerEmail, sellerName, productTitle, productId) => {
  const productLink = `${config.frontendUrl}/product/${productId}`;
  const subject = `Bido - Đấu giá kết thúc: "${productTitle}" (Không có người mua)`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ff9800;">Xin chào ${sellerName},</h2>
      <p>Phiên đấu giá cho sản phẩm <strong>${productTitle}</strong> đã kết thúc.</p>
      
      <div style="background-color: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center;">
        <p style="margin: 0; font-size: 18px; color: #856404;">
          ⚠️ Không có người đặt giá nào
        </p>
      </div>
      
      <p>Bạn có thể:</p>
      <ul>
        <li>Đăng lại sản phẩm với giá khởi điểm thấp hơn</li>
        <li>Điều chỉnh mô tả để thu hút người mua</li>
        <li>Chọn thời điểm đăng phù hợp hơn</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${productLink}" 
           style="background-color: #ff9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Xem chi tiết
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        Email này được gửi tự động, vui lòng không reply.<br>
        © 2025 Bido. All rights reserved.
      </p>
    </div>
  `;
  
  const text = `${subject}\n\nKhông có người đặt giá cho sản phẩm này.\n\nXem tại: ${productLink}`;
  return sendEmail({ to: sellerEmail, subject, html, text });
};

// Auction ended - with winner
const sendAuctionEndedWinnerEmail = async (toEmail, userName, productTitle, productId, finalPrice, isWinner = false) => {
  const productLink = `${config.frontendUrl}/product/${productId}`;
  const subject = isWinner
    ? `Bido - Chúc mừng! Bạn đã thắng đấu giá "${productTitle}"`
    : `Bido - Đấu giá kết thúc: "${productTitle}"`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">Xin chào ${userName},</h2>
      ${isWinner 
        ? `<p style="font-size: 18px;">🎉 <strong>Chúc mừng!</strong> Bạn đã thắng đấu giá cho sản phẩm <strong>${productTitle}</strong>!</p>`
        : `<p>Phiên đấu giá cho sản phẩm <strong>${productTitle}</strong> đã kết thúc.</p>`
      }
      
      <div style="background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px;">
        <p style="margin: 0; font-size: 16px;"><strong>Giá cuối cùng:</strong></p>
        <p style="margin: 10px 0 0 0; font-size: 24px; color: #4CAF50; font-weight: bold;">
          ${finalPrice.toLocaleString('vi-VN')} VND
        </p>
      </div>
      
      ${isWinner 
        ? `<p>Vui lòng thanh toán trong vòng 24 giờ để hoàn tất giao dịch.</p>`
        : `<p>Sản phẩm đã có người thắng. Cảm ơn bạn đã tham gia!</p>`
      }
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${productLink}" 
           style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          ${isWinner ? 'Thanh toán ngay' : 'Xem chi tiết'}
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        Email này được gửi tự động, vui lòng không reply.<br>
        © 2025 Bido. All rights reserved.
      </p>
    </div>
  `;
  
  const text = `${subject}\n\nGiá cuối: ${finalPrice.toLocaleString('vi-VN')} VND\n\nXem tại: ${productLink}`;
  return sendEmail({ to: toEmail, subject, html, text });
};

// Question answered - notify asker and other watchers
const sendQuestionAnsweredEmail = async (toEmail, userName, productTitle, productId, question, answer) => {
  const productLink = `${config.frontendUrl}/product/${productId}`;
  const subject = `Bido - Câu hỏi của bạn về "${productTitle}" đã được trả lời`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">Xin chào ${userName},</h2>
      <p>Người bán đã trả lời câu hỏi của bạn về sản phẩm <strong>${productTitle}</strong>:</p>
      
      <div style="background-color: #f9f9f9; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #666; font-size: 14px;"><strong>Câu hỏi:</strong></p>
        <p style="margin: 10px 0 0 0; font-size: 15px;">${question}</p>
      </div>
      
      <div style="background-color: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #2e7d32; font-size: 14px;"><strong>Trả lời:</strong></p>
        <p style="margin: 10px 0 0 0; font-size: 15px; color: #1b5e20;">${answer}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${productLink}" 
           style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Xem sản phẩm
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        Email này được gửi tự động, vui lòng không reply.<br>
        © 2025 Bido. All rights reserved.
      </p>
    </div>
  `;
  
  const text = `${subject}\n\nCâu hỏi: ${question}\n\nTrả lời: ${answer}\n\nXem tại: ${productLink}`;
  return sendEmail({ to: toEmail, subject, html, text });
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendQuestionNotificationEmail,
  sendBidPlacedEmail,
  sendBidderDeniedEmail,
  sendAuctionEndedNoWinnerEmail,
  sendAuctionEndedWinnerEmail,
  sendQuestionAnsweredEmail
};
