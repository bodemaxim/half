import { supabase } from "./supabase-client"
import type { Transaction } from "./types"


export const getTransactions = async (): Promise<Transaction[]> => {
    const { error, data } = await supabase.from('transactions').select('*')
  
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