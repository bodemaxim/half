import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { FloatLabel } from 'primereact/floatlabel'

export const HomePage = () => {
  const navigate = useNavigate()
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  const userOptions = [
    { label: 'Макс', value: 'max' },
    { label: 'Саша', value: 'sasha' },
  ]

  return (
    <div className="p-5">
      <h1 className="text-3xl font-bold my-5 text-center mb-10">Главная страница</h1>
        <div className="w-full md:w-1/2 mb-5 mx-auto">
          <FloatLabel className="w-full">
            <Dropdown
              inputId="user-select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.value)}
              options={userOptions}
              placeholder="Выберите пользователя"
              className="w-full"
            />
            <label htmlFor="user-select">Пользователь</label>
          </FloatLabel>
        </div>

        <div className="w-full md:w-1/2 mb-5 mx-auto">
          <Button
            severity="success"
            label="Создать"
            onClick={() => navigate('/new')}
            className="w-full mt-2"
          />
        </div>
        <div className="w-full md:w-1/2 mb-5 mx-auto">
          <Button
            severity="secondary"
            label="Транзакции"
            onClick={() => navigate('/transactions')}
            className="w-full  mt-2"
          />
        </div>
      <p
        className="mt-10 cursor-pointer text-blue-500 underline text-center"
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

