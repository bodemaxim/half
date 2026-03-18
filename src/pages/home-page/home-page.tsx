import { useNavigate } from 'react-router-dom'
import { Button } from 'primereact/button'

export const HomePage = () => {
  const navigate = useNavigate()

  return (
    <div className="p-5">
      <h1 className="text-3xl font-bold my-5">Главная страница</h1>
      <div className="flex flex-column gap-2">
        <Button
          severity="secondary"
          label="Перейти к транзакциям"
          onClick={() => navigate('/transactions')}
          className="mt-2"
        />
      </div>
      <p
        className="mt-5 cursor-pointer text-blue-500 underline"
        onClick={() => {
          localStorage.removeItem('half_password')
          navigate('/login')
        }}
      >
        Выйти
      </p>
    </div>
  )
}

