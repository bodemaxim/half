import { supabase } from "./supabase-client"
import type { Envelope, SavingsOperation, Transaction } from "./types"


type GetTransactionsParams = {
  from?: string
  to?: string
  limit?: number
}

export const getTransactions = async ({
  from,
  to,
  limit,
}: GetTransactionsParams = {}): Promise<Transaction[]> => {
    let query = supabase
        .from('transactions')
        .select('*')
        .order('payment_date', { ascending: false })

    if (from) {
      query = query.gte('payment_date', from)
    }

    if (to) {
      query = query.lte('payment_date', to)
    }

    if (typeof limit === 'number') {
      query = query.limit(limit)
    }

    const { error, data } = await query
  
    if (error) {
      alert(`Ошибка загрузки транзакций: ${error.message}`)

      return []
    }
  
    return data
  }

export const createTransaction = async (
  transaction: Omit<Transaction, 'id' | 'created_at'>
): Promise<Transaction | null> => {
  const { error, data } = await supabase
    .from('transactions')
    .insert(transaction)
    .select()
    .single()

  if (error) {
    alert(`Ошибка создания транзакции: ${error.message}`)

    return null
  }

  return data
}

export const updateTransaction = async (
  id: Transaction['id'],
  transaction: Partial<Omit<Transaction, 'id' | 'created_at'>>
): Promise<Transaction | null> => {
  const { error, data } = await supabase
    .from('transactions')
    .update(transaction)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    alert(`Ошибка обновления транзакции: ${error.message}`)

    return null
  }

  return data
}

export const deleteTransaction = async (id: Transaction['id']): Promise<boolean> => {
  const { error } = await supabase.from('transactions').delete().eq('id', id)

  if (error) {
    alert(`Ошибка удаления транзакции: ${error.message}`)

    return false
  }

  return true
}

type GetEnvelopesParams = {
  isActive?: boolean
}

export const getEnvelopes = async ({
  isActive,
}: GetEnvelopesParams = {}): Promise<Envelope[]> => {
  let query = supabase
    .from('envelopes')
    .select('*')
    .order('created_at', { ascending: false })

  if (typeof isActive === 'boolean') {
    query = query.eq('is_active', isActive)
  }

  const { error, data } = await query

  if (error) {
    alert(`Ошибка загрузки конвертов: ${error.message}`)

    return []
  }

  return data
}

export const getEnvelope = async (
  id: Envelope['id']
): Promise<Envelope | null> => {
  const { error, data } = await supabase
    .from('envelopes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    alert(`Ошибка загрузки конверта: ${error.message}`)

    return null
  }

  return data
}

export const createEnvelope = async (
  envelope: Omit<Envelope, 'id' | 'created_at'>
): Promise<Envelope | null> => {
  const { error, data } = await supabase
    .from('envelopes')
    .insert(envelope)
    .select()
    .single()

  if (error) {
    alert(`Ошибка создания конверта: ${error.message}`)

    return null
  }

  return data
}

export const updateEnvelope = async (
  id: Envelope['id'],
  envelope: Partial<Omit<Envelope, 'id' | 'created_at'>>
): Promise<Envelope | null> => {
  const { error, data } = await supabase
    .from('envelopes')
    .update(envelope)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    alert(`Ошибка обновления конверта: ${error.message}`)

    return null
  }

  return data
}

export const deleteEnvelope = async (id: Envelope['id']): Promise<boolean> => {
  const { error } = await supabase.from('envelopes').delete().eq('id', id)

  if (error) {
    alert(`Ошибка удаления конверта: ${error.message}`)

    return false
  }

  return true
}

type GetSavingsOperationsParams = {
  envelopeId?: string
}

export const getSavingsOperations = async ({
  envelopeId,
}: GetSavingsOperationsParams = {}): Promise<SavingsOperation[]> => {
  let query = supabase
    .from('savings_operations')
    .select('*')
    .order('created_at', { ascending: false })

  if (envelopeId) {
    query = query.eq('envelope_id', envelopeId)
  }

  const { error, data } = await query

  if (error) {
    alert(`Ошибка загрузки операций накоплений: ${error.message}`)

    return []
  }

  return data
}

export const createSavingsOperation = async (
  operation: Omit<SavingsOperation, 'id'>
): Promise<SavingsOperation | null> => {
  const { error, data } = await supabase
    .from('savings_operations')
    .insert(operation)
    .select()
    .single()

  if (error) {
    alert(`Ошибка создания операции накоплений: ${error.message}`)

    return null
  }

  return data
}

export const updateSavingsOperation = async (
  id: SavingsOperation['id'],
  operation: Partial<Omit<SavingsOperation, 'id'>>
): Promise<SavingsOperation | null> => {
  const { error, data } = await supabase
    .from('savings_operations')
    .update(operation)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    alert(`Ошибка обновления операции накоплений: ${error.message}`)

    return null
  }

  return data
}

export const deleteSavingsOperation = async (
  id: SavingsOperation['id']
): Promise<boolean> => {
  const { error } = await supabase
    .from('savings_operations')
    .delete()
    .eq('id', id)

  if (error) {
    alert(`Ошибка удаления операции накоплений: ${error.message}`)

    return false
  }

  return true
}