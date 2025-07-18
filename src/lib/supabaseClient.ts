import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qzsxayglyekpzxljvjdc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6c3hheWdseWVrcHp4bGp2amRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NzA1NDksImV4cCI6MjA2ODQ0NjU0OX0.wBx12-Y-gm8DojxIwUtnjRUUkeeKgzxph6APD0cCde4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 