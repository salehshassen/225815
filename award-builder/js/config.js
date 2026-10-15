// Public settings for the website (safe to publish).
// 1. supabaseUrl: Supabase Dashboard > Project Settings > API Keys / Data API: "Project URL"
// 2. supabasePublishableKey: Supabase Dashboard > Project Settings > API Keys: the key starting with PASTE_YOUR_PUBLISHABLE_KEY_HERE
// The publishable key only allows what the database rules permit (customers can read their own record, nothing more).
// NEVER put a secret key (sb_secret_...) or a service_role key here. The site refuses to run if you do.
window.AWARD_CONFIG = {
  supabaseUrl: 'https://iyeavqsdtneksbumrrcw.supabase.co',
  supabasePublishableKey: 'sb_publishable_R56u5r7wKzTx2zAJWk_dig_UPVVbn9H'
};