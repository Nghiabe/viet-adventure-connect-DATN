// scripts/test-env.ts
import { loadEnv } from 'vite';

console.log('--- Running Environment Variable Isolation Test ---');
try {
  const mode = 'development';
  const env = loadEnv(mode, process.cwd(), '');
  console.log('Variables loaded by Vite `loadEnv` (keys only):', Object.keys(env));
  const apiKey = env.VITE_GOOGLE_API_KEY;
  if (apiKey && apiKey.length > 10) {
    console.log('✅ SUCCESS: VITE_GOOGLE_API_KEY was found and appears valid.');
    console.log(`   Value starts with: ${apiKey.substring(0, 8)}...`);
  } else {
    console.error('❌ FAILURE: VITE_GOOGLE_API_KEY is missing or empty in the loaded environment.');
  }
} catch (error) {
  console.error('❌ CRITICAL FAILURE: An error occurred while trying to load .env files.', error);
}
console.log('--- Test Complete ---');










