import os
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from pathlib import Path

async def log_notification(db, notification_type: str, recipient: str, status: str, provider: str, message_id: str = None, error_details: str = None):
    try:
        log_doc = {
            "type": notification_type,
            "recipient": recipient,
            "status": status,
            "provider": provider,
            "messageId": message_id or "",
            "errorDetails": error_details or "",
            "timestamp": datetime.utcnow()
        }
        await db.notification_logs.insert_one(log_doc)
    except Exception as e:
        print(f"Failed to log notification: {e}")

def _send_resend_email(api_key: str, from_email: str, to_email: str, subject: str, text_content: str, html_content: str, attachment_path: str = None) -> str:
    """Send email using Resend HTTP API to bypass SMTP port blocks on cloud hosts."""
    import urllib.request
    import json
    import base64
    
    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "EMRS-Admissions/1.0"
    }
    
    payload = {
        "from": from_email,
        "to": [to_email],
        "subject": subject,
        "html": html_content,
        "text": text_content
    }
    
    if attachment_path:
        path_obj = Path(attachment_path)
        if path_obj.exists() and path_obj.is_file():
            with open(path_obj, "rb") as f:
                encoded = base64.b64encode(f.read()).decode("utf-8")
            payload["attachments"] = [
                {
                    "content": encoded,
                    "filename": path_obj.name
                }
            ]
            
    req = urllib.request.Request(
        url, 
        data=json.dumps(payload).encode("utf-8"), 
        headers=headers, 
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            res_body = response.read().decode("utf-8")
            res_data = json.loads(res_body)
            return res_data.get("id", f"resend_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{to_email}")
    except Exception as e:
        if hasattr(e, 'read'):
            error_body = e.read().decode("utf-8")
            print(f"[Resend] API Error Details: {error_body}")
            raise Exception(f"Resend API error: {error_body}")
        else:
            print(f"[Resend] Connection Error: {e}")
            raise e

def _send_smtp_email_direct(to_email: str, subject: str, text_content: str, html_content: str, attachment_path: str = None) -> str:
    """Synchronous SMTP helper running inside executors to prevent blocking."""
    host = os.getenv("EMAIL_HOST", "smtp.gmail.com").strip()
    port_val = os.getenv("EMAIL_PORT", "587").strip()
    user = os.getenv("EMAIL_USER", "ps702189@gmail.com").strip()
    password = os.getenv("EMAIL_PASSWORD", "pzyq kjpl kwct nvqv").strip()
    
    if not user or not password:
        print(f"\n--- [SMTP MOCK CONSOLE] ---")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Content:\n{text_content}")
        if attachment_path:
            print(f"Attachment: {attachment_path}")
        print(f"---------------------------\n")
        return f"mock_smtp_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{to_email}"
        
    port = int(port_val)
    
    # Construct Email Message
    msg = MIMEMultipart("alternative")
    msg["From"] = f"EMRS Dornala Admissions <{user}>"
    msg["To"] = to_email.strip()
    msg["Subject"] = subject
    
    # Attach content
    msg.attach(MIMEText(text_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))
    
    # Attach file if present
    if attachment_path:
        path_obj = Path(attachment_path)
        if path_obj.exists() and path_obj.is_file():
            part = MIMEBase("application", "octet-stream")
            with open(path_obj, "rb") as f:
                part.set_payload(f.read())
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f"attachment; filename={path_obj.name}"
            )
            # Reconstruct MIMEMultipart with attachment
            outer_msg = MIMEMultipart()
            outer_msg["From"] = msg["From"]
            outer_msg["To"] = msg["To"]
            outer_msg["Subject"] = msg["Subject"]
            outer_msg.attach(msg) # Attach alternative part inside
            outer_msg.attach(part) # Attach file
            msg = outer_msg
            
    # Send via SMTP connection
    try:
        if port == 465:
            print("[SMTP] Connecting via SSL to target host...")
            server = smtplib.SMTP_SSL(host, port, timeout=15)
        else:
            print("[SMTP] Connecting via STARTTLS to target host...")
            server = smtplib.SMTP(host, port, timeout=15)
            print("[SMTP] Sending EHLO 1...")
            server.ehlo()
            print("[SMTP] Sending STARTTLS...")
            server.starttls()
            print("[SMTP] Sending EHLO 2...")
            server.ehlo()
            
        print("[SMTP] Attempting login...")
        server.login(user, password)
        print("[SMTP] Sending email message...")
        server.sendmail(user, to_email, msg.as_string())
        print("[SMTP] Quitting server...")
        server.quit()
        print("[SMTP] Email sent successfully.")
    except Exception as smtp_err:
        print(f"[SMTP] Error during email transaction: {smtp_err}")
        raise smtp_err
    
    # Generate mock message id for logging
    return f"smtp_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{to_email}"

def _send_smtp_email(to_email: str, subject: str, text_content: str, html_content: str, attachment_path: str = None) -> str:
    """Wrapper that routes email dispatch to Resend if RESEND_API_KEY is configured, else falls back to SMTP."""
    resend_api_key = os.getenv("RESEND_API_KEY", "").strip()
    if resend_api_key:
        print("[Resend] Sending email via Resend API...")
        from_email = os.getenv("RESEND_FROM", "").strip()
        if not from_email:
            # Resend onboarding fallback address
            from_email = "onboarding@resend.dev"
        sender = f"EMRS Dornala Admissions <{from_email}>"
        return _send_resend_email(resend_api_key, sender, to_email, subject, text_content, html_content, attachment_path)
    
    return _send_smtp_email_direct(to_email, subject, text_content, html_content, attachment_path)

async def send_otp_email(db, email: str, otp: str) -> bool:
    subject = "EMRS Dornala Email Verification Code"
    text_content = f"Your verification code is: {otp}\nThis OTP will expire in 10 minutes."
    html_content = f"""
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 25px; border-radius: 8px;">
        <h2 style="color: #002B49; border-bottom: 2px solid #28a745; padding-bottom: 8px;">EMRS Dornala Admissions</h2>
        <p>Hello,</p>
        <p>Thank you for initiating the online admission process for Eklavya Model Residential School, Dornala. Please use the following One-Time Password (OTP) to verify your email address:</p>
        <div style="background-color: #f8fafc; border: 1px dashed #0056B3; padding: 15px; text-align: center; margin: 20px 0; border-radius: 6px;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #0056B3;">{otp}</span>
        </div>
        <p style="color: #ef4444; font-weight: bold;">This OTP is valid for 10 minutes only. Please do not share this code with anyone.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;"/>
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">This is an automated notification. Please do not reply to this email.</p>
      </div>
    """
    try:
        import asyncio
        msg_id = await asyncio.to_thread(_send_smtp_email, email, subject, text_content, html_content)
        await log_notification(db, "email", email, "success", "nodemailer", msg_id)
        return True
    except Exception as e:
        await log_notification(db, "email", email, "failed", "nodemailer", None, str(e))
        print(f"Error sending OTP email: {e}")
        return False

async def send_application_confirmation(db, email: str, app_details: dict, pdf_path: str = None) -> bool:
    subject = "EMRS Dornala Application Submitted Successfully"
    frontend_url = os.getenv("FRONTEND_URL", "https://emrsdornala.vercel.app").strip()
    tracking_link = f"{frontend_url}/track-status.html"
    
    text_content = (
        f"Dear Parent/Guardian,\n\nWe have received the admission application for {app_details.get('studentName')}. \n\n"
        f"Application Details:\n"
        f"- Application Number: {app_details.get('applicationNo')}\n"
        f"- Class: Class {app_details.get('classApplying')}\n"
        f"- Date of Submission: {app_details.get('submittedAt')}\n"
        f"- Status: {app_details.get('status')}\n\n"
        f"You can track the application status here: {tracking_link}\n\n"
        f"Please find the attached copy of your filled application PDF.\n\nRegards,\nEMRS Dornala"
    )
    
    html_content = f"""
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 25px; border-radius: 8px;">
        <h2 style="color: #002B49; border-bottom: 2px solid #28a745; padding-bottom: 8px;">EMRS Dornala Admissions</h2>
        <p>Dear Parent/Guardian,</p>
        <p>We are pleased to inform you that the online admission application has been received successfully.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Application Number:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">{app_details.get('applicationNo')}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Student Name:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">{app_details.get('studentName')}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Class Applied For:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">Class {app_details.get('classApplying')}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Submission Date:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">{app_details.get('submittedAt')}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Current Status:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #d97706; font-weight: bold;">{app_details.get('status')}</td>
          </tr>
        </table>
        <p>You can track the progress of this application using our online tracking system at any time:</p>
        <p style="text-align: center; margin: 25px 0;">
          <a href="{tracking_link}" style="background-color: #0056B3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Track Application Status</a>
        </p>
        <p>A copy of your submitted application has been generated and attached as a PDF file to this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;"/>
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">Eklavya Model Residential School, Dornala, Prakasam Dist, Andhra Pradesh.</p>
      </div>
    """
    
    try:
        import asyncio
        msg_id = await asyncio.to_thread(_send_smtp_email, email, subject, text_content, html_content, pdf_path)
        await log_notification(db, "email", email, "success", "nodemailer", msg_id)
        return True
    except Exception as e:
        await log_notification(db, "email", email, "failed", "nodemailer", None, str(e))
        print(f"Error sending confirmation email: {e}")
        return False

async def send_approval_email(db, email: str, app_details: dict, remarks: str = "", next_instructions: str = "") -> bool:
    subject = "EMRS Dornala Admission Approved"
    remarks_val = remarks or "Approved"
    instructions_val = next_instructions or "Please report to the school office with original certificates for physical verification."
    
    text_content = (
        f"Dear Parent/Guardian,\n\nCongratulations! The admission application for {app_details.get('studentName')} "
        f"(App No: {app_details.get('applicationNo')}) has been APPROVED.\n\n"
        f"Remarks: {remarks_val}\n\n"
        f"Next Steps / Instructions: {instructions_val}\n\n"
        f"Regards,\nEMRS Dornala"
    )
    
    html_content = f"""
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 25px; border-radius: 8px;">
        <h2 style="color: #002B49; border-bottom: 2px solid #28a745; padding-bottom: 8px;">EMRS Dornala Admissions</h2>
        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #166534; margin-top: 0; margin-bottom: 5px;">🎉 Application Approved</h3>
          <p style="color: #14532d; font-size: 14px; margin: 0;">The application for <b>{app_details.get('studentName')}</b> has been officially approved for admission.</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569; width: 40%;">Application Number:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">{app_details.get('applicationNo')}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Admission Status:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #16a34a; font-weight: bold;">APPROVED</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Admin Remarks:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">{remarks_val}</td>
          </tr>
        </table>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 18px; border-radius: 6px; margin-top: 25px;">
          <h4 style="color: #002B49; margin-top: 0; margin-bottom: 8px;">Next Steps for Verification:</h4>
          <p style="font-size: 13px; color: #334155; line-height: 1.6; margin: 0;">
            {instructions_val}
          </p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;"/>
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">Eklavya Model Residential School, Dornala, Prakasam Dist, Andhra Pradesh.</p>
      </div>
    """
    
    try:
        import asyncio
        msg_id = await asyncio.to_thread(_send_smtp_email, email, subject, text_content, html_content)
        await log_notification(db, "email", email, "success", "nodemailer", msg_id)
        return True
    except Exception as e:
        await log_notification(db, "email", email, "failed", "nodemailer", None, str(e))
        print(f"Error sending approval email: {e}")
        return False

async def send_rejection_email(db, email: str, app_details: dict, reason: str = "") -> bool:
    subject = "EMRS Dornala Admission Update"
    reason_val = reason or "Discrepancy in submitted documents."
    
    text_content = (
        f"Dear Parent/Guardian,\n\nWe regret to inform you that the admission application for {app_details.get('studentName')} "
        f"(App No: {app_details.get('applicationNo')}) has been REJECTED.\n\n"
        f"Reason/Remarks: {reason_val}\n\n"
        f"For queries, please contact the school administration office.\n\n"
        f"Regards,\nEMRS Dornala"
    )
    
    html_content = f"""
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 25px; border-radius: 8px;">
        <h2 style="color: #002B49; border-bottom: 2px solid #28a745; padding-bottom: 8px;">EMRS Dornala Admissions</h2>
        <div style="background-color: #fef2f2; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #991b1b; margin-top: 0; margin-bottom: 5px;">Application Rejected</h3>
          <p style="color: #7f1d1d; font-size: 14px; margin: 0;">The application for <b>{app_details.get('studentName')}</b> has been declined by the admissions board.</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569; width: 40%;">Application Number:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">{app_details.get('applicationNo')}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Admission Status:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #dc2626; font-weight: bold;">REJECTED</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Reason for Rejection:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">{reason_val}</td>
          </tr>
        </table>
        <p style="font-size: 13px; color: #475569;">If you believe this is an error or wish to apply with correct certificates next year, please contact the school administration office directly.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;"/>
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">Eklavya Model Residential School, Dornala, Prakasam Dist, Andhra Pradesh.</p>
      </div>
    """
    
    try:
        import asyncio
        msg_id = await asyncio.to_thread(_send_smtp_email, email, subject, text_content, html_content)
        await log_notification(db, "email", email, "success", "nodemailer", msg_id)
        return True
    except Exception as e:
        await log_notification(db, "email", email, "failed", "nodemailer", None, str(e))
        print(f"Error sending rejection email: {e}")
        return False

async def send_correction_request_email(db, email: str, app_details: dict, correction_details: str = "") -> bool:
    subject = "Correction Required: Admission Application - EMRS Dornala"
    details_val = correction_details or "Please re-upload a clear copy of the caste certificate or previous school study records. Contact the school office for assistance."
    
    text_content = (
        f"Dear Parent/Guardian,\n\nYour admission application for {app_details.get('studentName')} "
        f"(App No: {app_details.get('applicationNo')}) requires correction before we can proceed with verification.\n\n"
        f"Required Modifications:\n{details_val}\n\n"
        f"Please visit the school or contact us to make the required corrections.\n\n"
        f"Regards,\nEMRS Dornala"
    )
    
    html_content = f"""
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 25px; border-radius: 8px;">
        <h2 style="color: #002B49; border-bottom: 2px solid #28a745; padding-bottom: 8px;">EMRS Dornala Admissions</h2>
        <div style="background-color: #fffbeb; border-left: 4px solid #d97706; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #92400e; margin-top: 0; margin-bottom: 5px;">⚠️ Correction Required</h3>
          <p style="color: #78350f; font-size: 14px; margin: 0;">Some fields or documents in the application for <b>{app_details.get('studentName')}</b> require adjustment.</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569; width: 40%;">Application Number:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">{app_details.get('applicationNo')}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Admission Status:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #d97706; font-weight: bold;">CORRECTION REQUIRED</td>
          </tr>
        </table>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 18px; border-radius: 6px; margin-top: 25px;">
          <h4 style="color: #92400e; margin-top: 0; margin-bottom: 8px;">Required Action Details:</h4>
          <p style="font-size: 13px; color: #334155; line-height: 1.6; margin: 0;">
            {details_val}
          </p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;"/>
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">Eklavya Model Residential School, Dornala, Prakasam Dist, Andhra Pradesh.</p>
      </div>
    """
    
    try:
        import asyncio
        msg_id = await asyncio.to_thread(_send_smtp_email, email, subject, text_content, html_content)
        await log_notification(db, "email", email, "success", "nodemailer", msg_id)
        return True
    except Exception as e:
        await log_notification(db, "email", email, "failed", "nodemailer", None, str(e))
        print(f"Error sending correction request email: {e}")
        return False

async def send_status_update_email(db, email: str, app_details: dict, status: str, remarks: str = "", next_instructions: str = "") -> bool:
    subject = "EMRS Dornala Application Status Updated"
    remarks_val = remarks or "No specific remarks."
    instructions_val = next_instructions or "No additional instructions at this time."
    
    text_content = (
        f"Dear Parent/Guardian,\n\nThe status of the admission application for {app_details.get('studentName')} "
        f"(App No: {app_details.get('applicationNo')}) has been updated to: {status}.\n\n"
        f"Remarks: {remarks_val}\n\n"
        f"Next Steps / Instructions: {instructions_val}\n\n"
        f"Regards,\nEMRS Dornala"
    )
    
    html_content = f"""
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 25px; border-radius: 8px;">
        <h2 style="color: #002B49; border-bottom: 2px solid #28a745; padding-bottom: 8px;">EMRS Dornala Admissions</h2>
        <div style="background-color: #f8fafc; border-left: 4px solid #0056B3; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #0056B3; margin-top: 0; margin-bottom: 5px;">Status Updated: {status}</h3>
          <p style="color: #334155; font-size: 14px; margin: 0;">The application for <b>{app_details.get('studentName')}</b> has been updated to <b>{status}</b>.</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569; width: 40%;">Application Number:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">{app_details.get('applicationNo')}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Admission Status:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #0056B3; font-weight: bold;">{status}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Admin Remarks:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">{remarks_val}</td>
          </tr>
        </table>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 18px; border-radius: 6px; margin-top: 25px;">
          <h4 style="color: #002B49; margin-top: 0; margin-bottom: 8px;">Next Steps / Instructions:</h4>
          <p style="font-size: 13px; color: #334155; line-height: 1.6; margin: 0;">
            {instructions_val}
          </p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;"/>
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">Eklavya Model Residential School, Dornala, Prakasam Dist, Andhra Pradesh.</p>
      </div>
    """
    
    try:
        import asyncio
        msg_id = await asyncio.to_thread(_send_smtp_email, email, subject, text_content, html_content)
        await log_notification(db, "email", email, "success", "nodemailer", msg_id)
        return True
    except Exception as e:
        await log_notification(db, "email", email, "failed", "nodemailer", None, str(e))
        print(f"Error sending status update email: {e}")
        return False


async def send_contact_message_email(db, name: str, email: str, subject: str, phone: str, message: str) -> bool:
    to_email = os.getenv("EMAIL_USER", "ps702189@gmail.com").strip()
    email_subject = f"EMRS Dornala Contact Form: {subject}"
    text_content = (
        f"You have received a new contact message from EMRS Dornala Contact Us Page.\n\n"
        f"Sender Details:\n"
        f"- Name: {name}\n"
        f"- Email: {email}\n"
        f"- Phone: {phone}\n\n"
        f"Message:\n{message}"
    )
    html_content = f"""
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 25px; border-radius: 8px;">
        <h2 style="color: #002B49; border-bottom: 2px solid #28a745; padding-bottom: 8px;">EMRS Dornala Contact Form</h2>
        <p>You have received a new contact message:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569; width: 30%;">Name:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">{name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Email:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;"><a href="mailto:{email}">{email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Phone:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;"><a href="tel:{phone}">{phone}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Subject:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">{subject}</td>
          </tr>
        </table>
        <p><strong>Message:</strong></p>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 6px; white-space: pre-wrap;">{message}</div>
      </div>
    """
    try:
        import asyncio
        msg_id = await asyncio.to_thread(_send_smtp_email, to_email, email_subject, text_content, html_content)
        await log_notification(db, "email", to_email, "success", "nodemailer", msg_id)
        return True
    except Exception as e:
        await log_notification(db, "email", to_email, "failed", "nodemailer", None, str(e))
        print(f"Error sending contact email: {e}")
        return False

