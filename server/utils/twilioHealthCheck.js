// Twilio Health Check Utility
// This utility helps diagnose Twilio configuration issues

const checkTwilioConfiguration = () => {
  const config = {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER
  };

  const issues = [];
  const warnings = [];

  // Check if all required environment variables are present
  if (!config.accountSid) {
    issues.push('TWILIO_ACCOUNT_SID is not configured');
  }

  if (!config.authToken) {
    issues.push('TWILIO_AUTH_TOKEN is not configured');
  }

  if (!config.phoneNumber) {
    issues.push('TWILIO_PHONE_NUMBER is not configured');
  }

  // Validate format of phone number if present
  if (config.phoneNumber && !config.phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
    warnings.push('TWILIO_PHONE_NUMBER format may be invalid (should be in E.164 format like +1234567890)');
  }

  // Check if Account SID format looks correct
  if (config.accountSid && !config.accountSid.startsWith('AC')) {
    warnings.push('TWILIO_ACCOUNT_SID should start with "AC"');
  }

  const isConfigured = issues.length === 0;

  return {
    isConfigured,
    issues,
    warnings,
    config: isConfigured ? config : null
  };
};

const logTwilioStatus = () => {
  const check = checkTwilioConfiguration();
  
  if (check.isConfigured) {
    console.log('✅ Twilio SMS service is properly configured');
    if (check.warnings.length > 0) {
      console.warn('⚠️  Twilio warnings:');
      check.warnings.forEach(warning => console.warn(`   - ${warning}`));
    }
  } else {
    console.warn('❌ Twilio SMS service is not configured:');
    check.issues.forEach(issue => console.warn(`   - ${issue}`));
    console.warn('   SMS notifications will be disabled');
  }

  return check;
};

export { checkTwilioConfiguration, logTwilioStatus };
