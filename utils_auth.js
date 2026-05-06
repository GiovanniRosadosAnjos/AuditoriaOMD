export async function obterUsuarioIdAutenticado() {
  if (!window.supabaseClient) {
    throw new Error('SupabaseClient não inicializado.');
  }

  const {
    data: { user },
    error
  } = await window.supabaseClient.auth.getUser();

  if (error) throw error;

  if (!user?.id) {
    throw new Error('Usuário não autenticado.');
  }

  return user.id;
}
