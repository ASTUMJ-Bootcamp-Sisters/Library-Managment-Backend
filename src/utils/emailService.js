const nodemailer = require("nodemailer");

// Create a centralized email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      pass: process.env.NODE_CODE_SENDING_EMAIL_PASSWORD,
    },
  });
};

// Generic function to send emails
const sendEmail = async (to, subject, htmlContent) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to,
      subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

module.exports = {
  createTransporter,
  sendEmail
};
