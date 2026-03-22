import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import { getTransactions } from './api'
import type { Transaction } from './api/types'
import { TransactionsPage } from './pages/transactions-page/transactions-page'
import { HomePage } from './pages/home-page/home-page'
import { LoginPage } from './pages/login-page/login-page'
import { EditPage } from './pages/edit-page/edit-page'

function ClosePeriodPage({
  payer,
  transactions,
}: {
  payer: Transaction['payer'] | null
  transactions: Transaction[]
}) {
  const location = useLocation()
  const state = location.state as
    | { amount?: number; trackingStartDate?: string | null }
    | null
    | undefined

  const trackingStartDate =
    state?.trackingStartDate ??
    (typeof transactions[0]?.tracking_start_date === 'string'
      ? transactions[0].tracking_start_date
      : undefined)

  return (
    <EditPage
      mode="close_period"
      payer={payer}
      trackingStartDate={trackingStartDate}
      defaultAmount={state?.amount}
    />
  )
}

function AppInner() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [payer, setPayer] = useState<Transaction['payer'] | null>(null)
  const selectedUserStorageKey = 'half_selected_user'

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getTransactions()
        setTransactions(data)
      } catch (e) {
        console.error('getTransactions failed:', e)
      }
    }

    void load()
  }, [])

  useEffect(() => {
    const savedUser = localStorage.getItem(selectedUserStorageKey)
    if (savedUser === 'max' || savedUser === 'sasha') {
      setPayer(savedUser)
    }
  }, [])

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/home"
          element={<HomePage payer={payer} setPayer={setPayer} transactions={transactions} />}
        />
        <Route
          path="/new"
          element={
            <EditPage
              mode="new"
              payer={payer}
              trackingStartDate={
                transactions.length > 0
                  ? transactions[transactions.length - 1].tracking_start_date
                  : undefined
              }
            />
          }
        />
        <Route
          path="/close-period"
          element={<ClosePeriodPage payer={payer} transactions={transactions} />}
        />
        <Route
          path="/transactions"
          element={<TransactionsPage transactions={transactions} />}
        />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter basename="/half">
      <AppInner />
    </BrowserRouter>
  )
}

export default App
