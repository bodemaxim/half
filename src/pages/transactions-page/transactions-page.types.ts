import type { Transaction } from '../../api/types'

export type TransactionsPageProps = {
  transactions: Transaction[]
  onDeleteTransaction: (id: Transaction['id']) => boolean | Promise<boolean>
}

