import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { getTransactions } from './api'
import type { Transaction } from './api/types'
import { TransactionsPage } from './pages/transactions-page/transactions-page'
import { HomePage } from './pages/home-page/home-page'
import { LoginPage } from './pages/login-page/login-page'

function AppInner() {
  const [transactions, setTransactions] = useState<Transaction[]>([])

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

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
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
