const nodemailer = require('nodemailer');

// Email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Send email notification
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('[Email] Email credentials not configured. Skipping email send.');
    return { success: false, reason: 'not_configured' };
  }

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"Blood Coordination System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });
    console.log(`[Email] Sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Send error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send SMS via Twilio
 */
const sendSMS = async ({ to, message }) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log('[SMS] Twilio credentials not configured. Skipping SMS send.');
    return { success: false, reason: 'not_configured' };
  }

  try {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
    console.log(`[SMS] Sent to ${to}: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('[SMS] Send error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send emergency alert to a donor
 */
const sendEmergencyAlert = async (donor, request) => {
  const results = { email: null, sms: null };

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc2626; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">🩸 EMERGENCY BLOOD REQUEST</h1>
      </div>
      <div style="padding: 30px; background: #fff;">
        <p>Dear <strong>${donor.name}</strong>,</p>
        <p>An emergency blood request has been submitted and you may be able to help.</p>
        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <p><strong>Blood Group Needed:</strong> ${request.bloodGroup}</p>
          <p><strong>Patient:</strong> ${request.patientName}</p>
          <p><strong>Hospital:</strong> ${request.hospital.name}, ${request.hospital.city}</p>
          <p><strong>Units Required:</strong> ${request.unitsRequired}</p>
          <p><strong>Urgency:</strong> ${request.urgencyLevel.toUpperCase()}</p>
          <p><strong>Contact:</strong> ${request.contactPhone}</p>
        </div>
        <p>Please log in to your donor dashboard to accept or decline this request.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/pages/donor-dashboard.html"
           style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 10px;">
          Respond to Request
        </a>
        <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
          If you are not eligible to donate at this time, please decline so we can find another donor.
        </p>
      </div>
    </div>
  `;

  results.email = await sendEmail({
    to: donor.email,
    subject: `🩸 URGENT: ${request.bloodGroup} Blood Needed - ${request.hospital.city}`,
    html: emailHtml,
    text: `Emergency blood request: ${request.bloodGroup} needed at ${request.hospital.name}. Contact: ${request.contactPhone}`
  });

  const smsMessage = `URGENT: ${request.bloodGroup} blood needed at ${request.hospital.name}, ${request.hospital.city}. ${request.unitsRequired} unit(s). Contact: ${request.contactPhone}. Reply YES to accept. - Blood Coordination System`;
  results.sms = await sendSMS({ to: donor.phone, message: smsMessage });

  return results;
};

/**
 * Send request status update to patient
 */
const sendStatusUpdate = async (user, request, status) => {
  const messages = {
    accepted: 'A donor has accepted your blood request and is on their way.',
    fulfilled: 'Your blood request has been fulfilled. Thank you for using our service.',
    cancelled: 'Your blood request has been cancelled.',
  };

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e40af; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Blood Request Update</h1>
      </div>
      <div style="padding: 30px; background: #fff;">
        <p>Dear <strong>${user.name}</strong>,</p>
        <p>${messages[status] || `Your request status has been updated to: ${status}`}</p>
        <div style="background: #eff6ff; border-left: 4px solid #1e40af; padding: 15px; margin: 20px 0;">
          <p><strong>Request Status:</strong> ${status.toUpperCase()}</p>
          <p><strong>Blood Group:</strong> ${request.bloodGroup}</p>
          <p><strong>Hospital:</strong> ${request.hospital.name}</p>
        </div>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/pages/patient-dashboard.html"
           style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Dashboard
        </a>
      </div>
    </div>
  `;

  return await sendEmail({
    to: user.email,
    subject: `Blood Request Update - ${status.toUpperCase()}`,
    html: emailHtml,
    text: messages[status] || `Request status: ${status}`
  });
};

module.exports = { sendEmail, sendSMS, sendEmergencyAlert, sendStatusUpdate };
