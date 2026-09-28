import type { enumConfig } from "./consts"

export type Transaction = {
    id: string
    created_at: string
    payment_date: string
    payer: 'max' | 'sasha'
    amount: number
    type: 'purchase' | 'transfer'
    on_max: number
    on_sasha: number
    category: string
    tracking_start_date: string
    description: string
}

export type Category = typeof enumConfig.categories[number]['value'];
export type CategoryExpenses = Record<Category, number>

export type Envelope = {
  id: string
  created_at: string
  name: string
  description: string | null
  is_active: boolean
  user: 'max' | 'sasha'
}

export type SavingsOperationType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'

export type SavingsCurrency = 'RUB' | 'EUR' | 'USD' | 'AMD' | 'RSD'

export type SavingsOperation = {
  id: string
  created_at: string
  envelope_id: string
  amount: number
  currency: SavingsCurrency
  operation_type: SavingsOperationType
  description: string | null
  related_operation_id: string | null
  user: 'max' | 'sasha'
}