import dotenv from 'dotenv';

dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN!,
  supabase: {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  polling: {
    interval: 300, // 300ms
    timeout: 10, // 10 seconds
  },
  eta: {
    minutesPerKm: 5, // 5 minutes per km
  },
  spreadsheet: {
    webhookUrl:
      process.env.SPREADSHEET_WEBHOOK_URL ||
      'https://script.google.com/macros/s/AKfycbxe5xK7fOwhC2Z4Z3khcjZ5n0N3e_-qsXwigNPeHXyDtFu2aXZqon3aIdI58Aqkciej/exec',
  },
  employeeGroupChatId: process.env.EMPLOYEE_GROUP_CHAT_ID || '',
  payroll: {
    shiftRate: 45000,
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'BOT_TOKEN',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

console.log('✅ Configuration loaded successfully');