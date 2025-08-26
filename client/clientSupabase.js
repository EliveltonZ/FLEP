require("dotenv").config({ path: "./client/.env" });
const supabaseClient = require("@supabase/supabase-js");

const supabase = supabaseClient.createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = supabase;
