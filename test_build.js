const { createClient } = require('@supabase/supabase-js');
try {
  createClient(undefined, undefined);
} catch (e) {
  console.log('Supabase:', e.message);
}
try {
  const Razorpay = require('razorpay');
  new Razorpay({ key_id: undefined, key_secret: undefined });
} catch (e) {
  console.log('Razorpay:', e.message);
}
