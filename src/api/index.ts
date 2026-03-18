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