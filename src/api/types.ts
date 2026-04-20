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