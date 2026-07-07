const nodemailer = require('nodemailer');
const path = require('path');

// Configure SMTP transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Send secure 6-digit OTP verification email.
 * @param {string} email 
 * @param {string} otp 
 */
async function sendOTPEmail(email, otp) {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"EMRS Dornala Admissions" <${process.env.EMAIL_USER}>`,
    to: email.trim(),
    subject: 'EMRS Admission Email Verification',
    text: `Your verification code is: ${otp}\nThis OTP will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 25px; border-radius: 8px;">
        <h2 style="color: #002B49; border-bottom: 2px solid #28a745; padding-bottom: 8px;">EMRS Dornala Admissions</h2>
        <p>Hello,</p>
        <p>Thank you for initiating the online admission process for Eklavya Model Residential School, Dornala. Please use the following One-Time Password (OTP) to verify your email address:</p>
        <div style="background-color: #f8fafc; border: 1px dashed #0056B3; padding: 15px; text-align: center; margin: 20px 0; border-radius: 6px;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #0056B3;">${otp}</span>
        </div>
        <p style="color: #ef4444; font-weight: bold;">This OTP is valid for 10 minutes only. Please do not share this code with anyone.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;"/>
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">This is an automated notification. Please do not reply to this email.</p>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
}

/**
 * Send application confirmation email immediately after submission.
 * @param {string} email 
 * @param {object} appDetails 
 * @param {string} pdfPath 
 */
async function sendApplicationConfirmation(email, appDetails, pdfPath) {
  const transporter = createTransporter();
  const trackingLink = `${process.env.FRONTEND_URL || 'https://emrsdornala.vercel.app'}/track-status.html`;
  
  const mailOptions = {
    from: `"EMRS Dornala Admissions" <${process.env.EMAIL_USER}>`,
    to: email.trim(),
    subject: 'Admission Application Received - EMRS Dornala',
    text: `Dear Parent/Guardian,\n\nWe have received the admission application for ${appDetails.studentName}. \n\nApplication Details:\n- Application Number: ${appDetails.applicationNo}\n- Class: ${appDetails.classApplying}\n- Date of Submission: ${appDetails.submittedAt}\n- Status: ${appDetails.status}\n\nYou can track the application status here: ${trackingLink}\n\nPlease find the attached copy of your filled application PDF.\n\nRegards,\nEMRS Dornala`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 25px; border-radius: 8px;">
        <h2 style="color: #002B49; border-bottom: 2px solid #28a745; padding-bottom: 8px;">EMRS Dornala Admissions</h2>
        <p>Dear Parent/Guardian,</p>
        <p>We are pleased to inform you that the online admission application has been received successfully.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Application Number:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${appDetails.applicationNo}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Student Name:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${appDetails.studentName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Class Applied For:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">Class ${appDetails.classApplying}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Submission Date:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${appDetails.submittedAt}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Current Status:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #d97706; font-weight: bold;">${appDetails.status}</td>
          </tr>
        </table>
        <p>You can track the progress of this application using our online tracking system at any time:</p>
        <p style="text-align: center; margin: 25px 0;">
          <a href="${trackingLink}" style="background-color: #0056B3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Track Application Status</a>
        </p>
        <p>A copy of your submitted application has been generated and attached as a PDF file to this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;"/>
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">Eklavya Model Residential School, Dornala, Prakasam Dist, Andhra Pradesh.</p>
      </div>
    `,
    attachments: pdfPath ? [
      {
        filename: `${appDetails.applicationNo}.pdf`,
        path: pdfPath
      }
    ] : []
  };

  return await transporter.sendMail(mailOptions);
}

/**
 * Send approval confirmation email.
 * @param {string} email 
 * @param {object} appDetails 
 * @param {string} remarks 
 * @param {string} nextInstructions 
 */
async function sendApprovalEmail(email, appDetails, remarks, nextInstructions) {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"EMRS Dornala Admissions" <${process.env.EMAIL_USER}>`,
    to: email.trim(),
    subject: 'Admission Application Approved - EMRS Dornala',
    text: `Dear Parent/Guardian,\n\nCongratulations! The admission application for ${appDetails.studentName} (App No: ${appDetails.applicationNo}) has been APPROVED.\n\nRemarks:\n${remarks || 'N/A'}\n\nNext Steps / Instructions:\n${nextInstructions || 'Please report to the school office with original certificates for physical verification.'}\n\nRegards,\nEMRS Dornala`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 25px; border-radius: 8px;">
        <h2 style="color: #002B49; border-bottom: 2px solid #28a745; padding-bottom: 8px;">EMRS Dornala Admissions</h2>
        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #166534; margin-top: 0; margin-bottom: 5px;">🎉 Application Approved</h3>
          <p style="color: #14532d; font-size: 14px; margin: 0;">The application for <b>${appDetails.studentName}</b> has been officially approved for admission.</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569; width: 40%;">Application Number:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${appDetails.applicationNo}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Admission Status:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #16a34a; font-weight: bold;">APPROVED</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Admin Remarks:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${remarks || 'Approved'}</td>
          </tr>
        </table>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 18px; border-radius: 6px; margin-top: 25px;">
          <h4 style="color: #002B49; margin-top: 0; margin-bottom: 8px;">Next Steps for Verification:</h4>
          <p style="font-size: 13px; color: #334155; line-height: 1.6; margin: 0;">
            ${nextInstructions || 'Please print your submitted application form and visit the school administration center before the final deadline with all original documents (Aadhaar, Caste, TC, and Birth Certificate) for physical verification.'}
          </p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;"/>
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">Eklavya Model Residential School, Dornala, Prakasam Dist, Andhra Pradesh.</p>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
}

/**
 * Send rejection email.
 * @param {string} email 
 * @param {object} appDetails 
 * @param {string} reason 
 */
async function sendRejectionEmail(email, appDetails, reason) {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"EMRS Dornala Admissions" <${process.env.EMAIL_USER}>`,
    to: email.trim(),
    subject: 'Admission Application Update - EMRS Dornala',
    text: `Dear Parent/Guardian,\n\nWe regret to inform you that the admission application for ${appDetails.studentName} (App No: ${appDetails.applicationNo}) has been REJECTED.\n\nReason/Remarks:\n${reason || 'Discrepancy in documents'}\n\nFor queries, please contact the school administration office.\n\nRegards,\nEMRS Dornala`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 25px; border-radius: 8px;">
        <h2 style="color: #002B49; border-bottom: 2px solid #28a745; padding-bottom: 8px;">EMRS Dornala Admissions</h2>
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #991b1b; margin-top: 0; margin-bottom: 5px;">Application Rejected</h3>
          <p style="color: #7f1d1d; font-size: 14px; margin: 0;">The application for <b>${appDetails.studentName}</b> has been declined by the admissions board.</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569; width: 40%;">Application Number:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${appDetails.applicationNo}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Admission Status:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #dc2626; font-weight: bold;">REJECTED</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Reason for Rejection:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${reason || 'Discrepancy in submitted documents.'}</td>
          </tr>
        </table>
        <p style="font-size: 13px; color: #475569;">If you believe this is an error or wish to apply with correct certificates next year, please contact the school administration office directly.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;"/>
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">Eklavya Model Residential School, Dornala, Prakasam Dist, Andhra Pradesh.</p>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
}

/**
 * Send correction request email.
 * @param {string} email 
 * @param {object} appDetails 
 * @param {string} correctionDetails 
 */
async function sendCorrectionRequestEmail(email, appDetails, correctionDetails) {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"EMRS Dornala Admissions" <${process.env.EMAIL_USER}>`,
    to: email.trim(),
    subject: 'Correction Required: Admission Application - EMRS Dornala',
    text: `Dear Parent/Guardian,\n\nYour admission application for ${appDetails.studentName} (App No: ${appDetails.applicationNo}) requires correction before we can proceed with verification.\n\nRequired Modifications:\n${correctionDetails || 'Please verify files'}\n\nPlease visit the school or contact us to make the required corrections.\n\nRegards,\nEMRS Dornala`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 25px; border-radius: 8px;">
        <h2 style="color: #002B49; border-bottom: 2px solid #28a745; padding-bottom: 8px;">EMRS Dornala Admissions</h2>
        <div style="background-color: #fffbeb; border-left: 4px solid #d97706; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #92400e; margin-top: 0; margin-bottom: 5px;">⚠️ Correction Required</h3>
          <p style="color: #78350f; font-size: 14px; margin: 0;">Some fields or documents in the application for <b>${appDetails.studentName}</b> require adjustment.</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569; width: 40%;">Application Number:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${appDetails.applicationNo}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Admission Status:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #d97706; font-weight: bold;">CORRECTION REQUIRED</td>
          </tr>
        </table>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 18px; border-radius: 6px; margin-top: 25px;">
          <h4 style="color: #92400e; margin-top: 0; margin-bottom: 8px;">Required Action Details:</h4>
          <p style="font-size: 13px; color: #334155; line-height: 1.6; margin: 0;">
            ${correctionDetails || 'Please re-upload a clear copy of the caste certificate or previous school study records. Contact the school office for assistance.'}
          </p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;"/>
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">Eklavya Model Residential School, Dornala, Prakasam Dist, Andhra Pradesh.</p>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
}

module.exports = {
  sendOTPEmail,
  sendApplicationConfirmation,
  sendApprovalEmail,
  sendRejectionEmail,
  sendCorrectionRequestEmail
};
