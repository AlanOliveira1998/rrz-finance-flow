import { supabase } from './supabaseClient'

type ActionType = 'create' | 'update' | 'delete'
type EntityType = 'cliente' | 'nota' | 'projeto' | 'proposta' | 'fornecedor' | 'boleto'

interface LogActivityParams {
  action: ActionType
  entityType: EntityType
  entityId?: string
  entityName?: string
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('activity_logs').insert({
      user_id: session.user.id,
      user_name: session.user.email,
      action_type: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      entity_name: params.entityName ?? null,
    })
  } catch {
    // Non-critical — never let logging break the main flow
  }
}
