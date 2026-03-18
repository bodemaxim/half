export type Transaction = {
    id: string
    created_at: string
    payer: 'max' | 'sasha'
    amount: number
    type: 'purchase' | 'transfer'
    on_max: number
    on_sasha: number
    category: string
    tracking_start_date: string
    description: string
}