const nodemailer = require('nodemailer');

// Configure transporter (use your email credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or 'hotmail', 'yahoo', or custom SMTP
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTP = async (toEmail, otp) => {
  const mailOptions = {
    from: `"BMS System" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your OTP for Signup',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f4f4;">
        <div style="max-width: 500px; margin: auto; background: white; border-radius: 10px; padding: 20px;">
          <h2 style="color: #2e7d32;">BMS System</h2>
          <p>Your OTP for signup is:</p>
          <h1 style="background: #e8f5e9; display: inline-block; padding: 10px 20px; border-radius: 5px; letter-spacing: 5px;">${otp}</h1>
          <p>This OTP is valid for <strong>10 minutes</strong>.</p>
          <hr />
          <p style="font-size: 12px; color: gray;">If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTP };