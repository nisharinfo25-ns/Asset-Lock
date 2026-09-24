const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://smmrucoztzigccunopqp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (!supabaseServiceKey) {
  console.warn('⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY is not set in environment variables. Database operations will require valid credentials.');
  // Initialize with placeholder to allow server startup and return proper error responses
  supabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder', {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
} else {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

const isSupabaseConfigured = () => {
  return !!(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder');
};

module.exports = { supabase, isSupabaseConfigured };
