// api/delete-user.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ATENÇÃO: nunca exponha essa key no frontend!
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId obrigatório' });
  }

  // (Opcional) Adicione autenticação para garantir que só admins possam usar essa rota

  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
};
