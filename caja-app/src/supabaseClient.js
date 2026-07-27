import { createClient } from '@supabase/supabase-js';

// Colocamos la URL y la Key directamente como texto (asegúrate de mantener las comillas)
const supabaseUrl = 'https://xaerfywydzwifohjsvwa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhZXJmeXd5ZHp3aWZvaGpzdndhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMDA4NjcsImV4cCI6MjEwMDU3Njg2N30.Qi_mb_0wWEtFxnTCpe4-yCvdmvO1vFmatVFGzjiyC8o';

export const supabase = createClient(supabaseUrl, supabaseKey);