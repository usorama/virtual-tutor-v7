import { load Env } from 'vite';

const env = loadEnv('test', process.cwd(), '');
console.log('NEXT_PUBLIC_SUPABASE_URL:', env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
console.log('All NEXT_PUBLIC vars:', Object.keys(env).filter(k => k.startsWith('NEXT_PUBLIC')));
