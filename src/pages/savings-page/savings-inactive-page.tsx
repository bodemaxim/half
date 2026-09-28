import { Button } from 'primereact/button'
import { Panel } from 'primereact/panel'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEnvelopes, getSavingsOperations, updateEnvelope } from '../../api'
import { useRubRates } from '../../api/currency'
import type { Envelope, SavingsOperation } from '../../api/types'
import { formatMoney, readSelectedSavingsUser, toRub } from './savings-utils'

export const SavingsInactivePage = () => {
  const navigate = useNavigate()
  const [operations, setOperations] = useState<SavingsOperation[]>([])
  const [envelopes, setEnvelopes] = useState<Envelope[]>([])
  const [reactivatingId, setReactivatingId] = useState<string | null>(null)
  const { rates } = useRubRates()

  useEffect(() => {
    const user = readSelectedSavingsUser()

    if (!user) {
      setOperations([])
      setEnvelopes([])

      return
    }

    void getSavingsOperations({ user }).then(setOperations)
    void getEnvelopes({ isActive: false, user }).then(setEnvelopes)
  }, [])

  const balanceByEnvelopeId = useMemo(() => {
    const balances: Record<string, number> = {}

    for (const operation of operations) {
      balances[operation.envelope_id] =
        (balances[operation.envelope_id] ?? 0) + toRub(operation, rates)
    }

    return balances
  }, [operations, rates])

  const handleReactivate = async (envelopeId: string) => {
    setReactivatingId(envelopeId)

    try {
      const updated = await updateEnvelope(envelopeId, { is_active: true })

      if (!updated) return

      setEnvelopes((prev) => prev.filter((envelope) => envelope.id !== envelopeId))
    } finally {
      setReactivatingId(null)
    }
  }

  return (
    <div className="h-dvh p-5 overflow-y-auto">
      <div className="w-full md:w-1/2 mx-auto">
        <div className="flex-b">
          <h1 className="text-3xl font-bold m-0 mb-4">Неактивные конверты</h1>
          <Button
            icon="pi pi-backward"
            rounded
            text
            aria-label="К накоплениям"
            className="transform translate-x-[16px]"
            onClick={() => navigate('/savings')}
          />
        </div>

        {envelopes.length === 0 ? (
          <div className="mt-4 text-sm text-surface-600">
            Нет неактивных конвертов
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {envelopes.map((envelope) => (
              <div
                key={envelope.id}
                className="cursor-pointer"
                onClick={() =>
                  navigate('/savings/view', {
                    state: { envelopeId: envelope.id },
                  })
                }
              >
                <Panel header={envelope.name} className="w-full">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xl font-semibold">
                      {formatMoney(balanceByEnvelopeId[envelope.id] ?? 0)} руб
                    </div>
                    <Button
                      label="Сделать активным"
                      rounded
                      text
                      loading={reactivatingId === envelope.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        void handleReactivate(envelope.id)
                      }}
                    />
                  </div>
                </Panel>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
