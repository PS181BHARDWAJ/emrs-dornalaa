const https = require('https');
const querystring = require('querystring');

// Helper to execute REST calls via native HTTPS
function makeHttpsRequest(url, method, headers, data = '') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        ...headers,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(data);
    req.end();
  });
}

/**
 * Main switch-based sender for SMS integrations.
 */
async function sendSMS(mobile, message) {
  const provider = (process.env.SMS_PROVIDER || 'twilio').toLowerCase().trim();
  
  if (provider === 'twilio') {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;
    
    if (!sid || !token || !fromPhone) {
      console.warn('Twilio settings missing in environment variables. SMS bypassed.');
      return { success: false, error: 'Twilio settings missing' };
    }

    const authHeader = 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64');
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const postData = querystring.stringify({
      To: mobile.startsWith('+') ? mobile : `+91${mobile}`, // default to India code +91
      From: fromPhone,
      Body: message
    });

    try {
      const response = await makeHttpsRequest(url, 'POST', {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      }, postData);
      return { success: true, response: JSON.parse(response) };
    } catch (err) {
      console.error('Twilio SMS Delivery Failed:', err.message);
      throw err;
    }
  } 
  else if (provider === 'msg91') {
    const apiKey = process.env.MSG91_API_KEY;
    if (!apiKey) {
      console.warn('MSG91 API key missing in environment. SMS bypassed.');
      return { success: false, error: 'MSG91 API key missing' };
    }

    const url = 'https://api.msg91.com/api/v5/otp';
    const payload = JSON.stringify({
      template_id: 'default_template_msg91', // Placeholder template id
      mobile: mobile.startsWith('+') ? mobile.replace('+', '') : `91${mobile}`,
      authkey: apiKey
    });

    try {
      const response = await makeHttpsRequest(url, 'POST', {
        'Content-Type': 'application/json',
        'authkey': apiKey
      }, payload);
      return { success: true, response: JSON.parse(response) };
    } catch (err) {
      console.error('MSG91 SMS Delivery Failed:', err.message);
      throw err;
    }
  } 
  else if (provider === 'fast2sms') {
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
      console.warn('Fast2SMS API key missing in environment. SMS bypassed.');
      return { success: false, error: 'Fast2SMS API key missing' };
    }

    const url = 'https://www.fast2sms.com/dev/bulkV2';
    const postData = querystring.stringify({
      authorization: apiKey,
      message: message,
      language: 'english',
      route: 'q',
      numbers: mobile
    });

    try {
      const response = await makeHttpsRequest(url, 'POST', {
        'Content-Type': 'application/x-www-form-urlencoded',
        'authorization': apiKey
      }, postData);
      return { success: true, response: JSON.parse(response) };
    } catch (err) {
      console.error('Fast2SMS SMS Delivery Failed:', err.message);
      throw err;
    }
  } 
  else {
    console.warn(`Unknown SMS Provider: ${provider}. SMS bypassed.`);
    return { success: false, error: 'Unknown provider' };
  }
}

/**
 * Mobile OTP send trigger.
 */
async function sendMobileOTP(mobile, otp) {
  const message = `EMRS Dornala\nYour OTP for admission verification is:\n${otp}\nValid for 10 minutes.`;
  return await sendSMS(mobile, message);
}

/**
 * Application Confirmation SMS trigger.
 */
async function sendApplicationConfirmation(mobile, appNo) {
  const message = `EMRS Dornala:\nApplication submitted successfully.\nApplication No: ${appNo}\nTrack your application on the website.`;
  return await sendSMS(mobile, message);
}

/**
 * Approval Notification SMS trigger.
 */
async function sendApprovalSMS(mobile, appNo) {
  const message = `EMRS Dornala:\nApplication No: ${appNo} has been approved.\nPlease check your email for further instructions.`;
  return await sendSMS(mobile, message);
}

/**
 * Rejection Notification SMS trigger.
 */
async function sendRejectionSMS(mobile, appNo) {
  const message = `EMRS Dornala:\nApplication No: ${appNo} has been rejected.\nCheck email for details.`;
  return await sendSMS(mobile, message);
}

module.exports = {
  sendMobileOTP,
  sendApplicationConfirmation,
  sendApprovalSMS,
  sendRejectionSMS
};
