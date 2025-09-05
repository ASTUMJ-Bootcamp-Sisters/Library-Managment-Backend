const { sendEmail } = require("./emailService");

async function sendEmailNotification(to, subject, html) {
  return await sendEmail(to, subject, html);
}

module.exports = sendEmailNotification;
