/**
 * Supabase Client Initialization
 */

// Replace these with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://mfxnghmuccevsxwcetej.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meG5naG11Y2NldnN4d2NldGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NTI1ODAsImV4cCI6MjA4NDQyODU4MH0.lktfglzBMaHd79hLFDRH1HHSwsEwZ56Tv6e287kQiFg';

if (typeof supabase !== 'undefined') {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error("Supabase script not loaded!");
}
