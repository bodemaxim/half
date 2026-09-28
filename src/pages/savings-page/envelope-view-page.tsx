import { Temporal } from '@js-temporal/polyfill'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { FloatLabel } from 'primereact/floatlabel'
import { InputNumber } from 'primereact/inputnumber'
import { InputTextarea } from 'primereact/inputtextarea'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  createSavingsOperation,
  deleteSavingsOperation,
  getEnvelope,
  getEnvelopes,
  getSavingsOperations,
  updateSavingsOperation,
} from '../../api'
import {
  buildCurrencyRateViews,
  readStoredCurrency,
  storeCurrency,
  useRubRates,
  type CurrencyCode,
} from '../../api/currency'
import type { Envelope, SavingsCurrency, SavingsOperation } from '../../api/types'
import { CurrencyRates } from '../../components/currency-rates'
import {
  type EnvelopeLocationState,
  formatMoney,
  operationTypeLabel,
  readSelectedSavingsUser,
  toRub,
} from './savings-utils'

type OperationDialogMode = 'deposit' | 'withdraw' | 'transfer'

const dialogTitleByMode: Record<OperationDialogMode, string> = {
  deposit: 'Внести',
  withdraw: 'Снять',
  transfer: 'Переместить',
}

const modeByOperationType: Record<
  SavingsOperation['operation_type'],
  OperationDialogMode
> = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdraw',
  TRANSFER_OUT: 'transfer',
  TRANSFER_IN: 'transfer',
}

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return ''

  try {
    const zonedDateTime = Temporal.Instant.from(value).toZonedDateTimeISO(
      'Europe/Moscow',
    )
    const day = String(zonedDateTime.day).padStart(2, '0')
    const month = String(zonedDateTime.month).padStart(2, '0')
    const year = String(zonedDateTime.year)
    const hour = String(zonedDateTime.hour).padStart(2, '0')
    const minute = String(zonedDateTime.minute).padStart(2, '0')

    return `${day}.${month}.${year} ${hour}:${minute}`
  } catch {
    return value
  }
}

export const EnvelopeViewPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as EnvelopeLocationState | null) ?? null
  const envelopeId = state?.envelopeId

  const [envelope, setEnvelope] = useState<Envelope | null>(null)
  const [envelopes, setEnvelopes] = useState<Envelope[]>([])
  const [allOperations, setAllOperations] = useState<SavingsOperation[]>([])
  const [loading, setLoading] = useState(true)
  const { rates, loading: ratesLoading } = useRubRates()

  const [selected, setSelected] = useState<SavingsOperation | null>(null)
  const [dialogMode, setDialogMode] = useState<OperationDialogMode | null>(null)
  const [editingOperation, setEditingOperation] = useState<SavingsOperation | null>(
    null,
  )
  const [amount, setAmount] = useState<number | null>(null)
  const [description, setDescription] = useState('')
  const [targetEnvelopeId, setTargetEnvelopeId] = useState<string | null>(null)
  const [operationDate, setOperationDate] = useState<Date>(new Date())
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode | null>(
    readStoredCurrency,
  )
  const [saving, setSaving] = useState(false)

  const rateViews = useMemo(() => buildCurrencyRateViews(rates), [rates])

  useEffect(() => {
    storeCurrency(selectedCurrency)
  }, [selectedCurrency])

  const reload = useCallback(async () => {
    if (!envelopeId) return

    const user = readSelectedSavingsUser()

    if (!user) {
      navigate('/savings', { replace: true })

      return
    }

    const [loadedEnvelope, loadedEnvelopes, loadedOperations] = await Promise.all([
      getEnvelope(envelopeId),
      getEnvelopes({ user }),
      getSavingsOperations({ user }),
    ])

    if (!loadedEnvelope || loadedEnvelope.user !== user) {
      navigate('/savings', { replace: true })

      return
    }

    setEnvelope(loadedEnvelope)
    setEnvelopes(loadedEnvelopes)
    setAllOperations(loadedOperations)
    setLoading(false)
  }, [envelopeId, navigate])

  useEffect(() => {
    if (!envelopeId) return

    void reload()
  }, [envelopeId, reload])

  const operations = useMemo(
    () =>
      envelopeId
        ? allOperations.filter((op) => op.envelope_id === envelopeId)
        : [],
    [allOperations, envelopeId],
  )

  useEffect(() => {
    if (!selected) return

    const stillExists = operations.some((op) => op.id === selected.id)

    if (!stillExists) {
      setSelected(null)
    }
  }, [operations, selected])

  const operationsById = useMemo(() => {
    const map = new Map<string, SavingsOperation>()

    for (const operation of allOperations) {
      map.set(operation.id, operation)
    }

    return map
  }, [allOperations])

  const envelopeNameById = useMemo(() => {
    const map = new Map<string, string>()

    for (const item of envelopes) {
      map.set(item.id, item.name)
    }

    return map
  }, [envelopes])

  const balance = useMemo(
    () => operations.reduce((sum, operation) => sum + toRub(operation, rates), 0),
    [operations, rates],
  )

  const transferTargets = useMemo(() => {
    const currentId = envelopeId
    const editingRelatedId =
      editingOperation?.related_operation_id != null
        ? operationsById.get(editingOperation.related_operation_id)?.envelope_id
        : null

    return envelopes
      .filter((item) => {
        if (item.id === currentId) return false
        if (item.is_active) return true
        return editingRelatedId !== null && item.id === editingRelatedId
      })
      .map((item) => ({ label: item.name, value: item.id }))
  }, [envelopes, envelopeId, editingOperation, operationsById])

  if (!envelopeId) {
    return <Navigate to="/savings" replace />
  }

  const resetDialogFields = () => {
    setAmount(null)
    setDescription('')
    setTargetEnvelopeId(null)
    setOperationDate(new Date())
    setEditingOperation(null)
  }

  const openDialog = (mode: OperationDialogMode) => {
    setDialogMode(mode)
    setEditingOperation(null)
    setAmount(null)
    setDescription('')
    setTargetEnvelopeId(null)
    setOperationDate(new Date())
  }

  const openEditDialog = (operation: SavingsOperation) => {
    const mode = modeByOperationType[operation.operation_type]

    setDialogMode(mode)
    setEditingOperation(operation)
    setAmount(Math.abs(operation.amount))
    setDescription(operation.description ?? '')
    setSelectedCurrency(operation.currency)
    setOperationDate(new Date(operation.created_at))

    if (
      operation.operation_type === 'TRANSFER_OUT' ||
      operation.operation_type === 'TRANSFER_IN'
    ) {
      const related = operation.related_operation_id
        ? operationsById.get(operation.related_operation_id)
        : null

      if (operation.operation_type === 'TRANSFER_OUT') {
        setTargetEnvelopeId(related?.envelope_id ?? null)
      } else {
        setTargetEnvelopeId(operation.envelope_id)
      }
    } else {
      setTargetEnvelopeId(null)
    }
  }

  const closeDialog = () => {
    setDialogMode(null)
    resetDialogFields()
  }

  const resolveCurrency = (): SavingsCurrency => selectedCurrency ?? 'RUB'

  const handleSubmitOperation = async () => {
    if (!dialogMode || !envelopeId) return

    if (amount === null || amount <= 0) {
      alert('Введите сумму больше нуля')

      return
    }

    if (!operationDate || Number.isNaN(operationDate.getTime())) {
      alert('Укажите дату операции')

      return
    }

    const user = readSelectedSavingsUser()

    if (!user) {
      alert('Сначала выберите пользователя на главной')

      return
    }

    const currency = resolveCurrency()
    const comment = description.trim() || null
    const createdAt = operationDate.toISOString()

    setSaving(true)

    try {
      if (editingOperation) {
        await handleUpdateOperation({
          editingOperation,
          amount,
          currency,
          comment,
          createdAt,
          targetEnvelopeId,
          currentEnvelopeId: envelopeId,
        })

        return
      }

      if (dialogMode === 'deposit') {
        const created = await createSavingsOperation({
          created_at: createdAt,
          envelope_id: envelopeId,
          amount,
          currency,
          operation_type: 'DEPOSIT',
          description: comment,
          related_operation_id: null,
          user,
        })

        if (!created) return

        closeDialog()
        await reload()

        return
      }

      if (dialogMode === 'withdraw') {
        const created = await createSavingsOperation({
          created_at: createdAt,
          envelope_id: envelopeId,
          amount: -amount,
          currency,
          operation_type: 'WITHDRAWAL',
          description: comment,
          related_operation_id: null,
          user,
        })

        if (!created) return

        closeDialog()
        await reload()

        return
      }

      if (!targetEnvelopeId) {
        alert('Выберите конверт назначения')

        return
      }

      const transferOut = await createSavingsOperation({
        created_at: createdAt,
        envelope_id: envelopeId,
        amount: -amount,
        currency,
        operation_type: 'TRANSFER_OUT',
        description: comment,
        related_operation_id: null,
        user,
      })

      if (!transferOut) return

      const transferIn = await createSavingsOperation({
        created_at: createdAt,
        envelope_id: targetEnvelopeId,
        amount,
        currency,
        operation_type: 'TRANSFER_IN',
        description: comment,
        related_operation_id: transferOut.id,
        user,
      })

      if (!transferIn) return

      await updateSavingsOperation(transferOut.id, {
        related_operation_id: transferIn.id,
      })

      closeDialog()
      await reload()
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateOperation = async ({
    editingOperation: op,
    amount: nextAmount,
    currency,
    comment,
    createdAt,
    targetEnvelopeId: nextTargetId,
    currentEnvelopeId,
  }: {
    editingOperation: SavingsOperation
    amount: number
    currency: SavingsCurrency
    comment: string | null
    createdAt: string
    targetEnvelopeId: string | null
    currentEnvelopeId: string
  }) => {
    if (op.operation_type === 'DEPOSIT' || op.operation_type === 'WITHDRAWAL') {
      const signedAmount =
        op.operation_type === 'DEPOSIT' ? nextAmount : -nextAmount
      const updated = await updateSavingsOperation(op.id, {
        amount: signedAmount,
        currency,
        description: comment,
        created_at: createdAt,
      })

      if (!updated) return

      closeDialog()
      setSelected(null)
      await reload()

      return
    }

    const related = op.related_operation_id
      ? operationsById.get(op.related_operation_id)
      : null

    if (!related) {
      alert('Не найдена парная операция перевода')

      return
    }

    if (!nextTargetId) {
      alert('Выберите конверт назначения')

      return
    }

    const outOp = op.operation_type === 'TRANSFER_OUT' ? op : related
    const inOp = op.operation_type === 'TRANSFER_IN' ? op : related

    // When editing TRANSFER_IN on this envelope, "Куда" is this envelope;
    // the other side (OUT) stays on the other envelope. Changing target means
    // changing where money arrives (inOp.envelope_id) when viewing from OUT,
    // or changing the source when... Actually:
    // - Editing OUT on current: target = inOp.envelope_id → nextTargetId updates IN
    // - Editing IN on current: the dropdown shows current as "Куда" which is confusing.
    //   For IN, "Куда" should stay as currentEnvelopeId; changing target isn't typical.
    // Plan: when editing OUT, nextTargetId updates IN.envelope_id.
    // When editing IN, nextTargetId is the current envelope (where money arrived);
    // if user picks another, move IN to that envelope (and OUT stays on other).

    let outEnvelopeId = outOp.envelope_id
    let inEnvelopeId = inOp.envelope_id

    if (op.operation_type === 'TRANSFER_OUT') {
      outEnvelopeId = currentEnvelopeId
      inEnvelopeId = nextTargetId
    } else {
      // Editing IN on current envelope: "Куда" was set to current; target change
      // moves the IN side. OUT remains on related.envelope_id.
      inEnvelopeId = nextTargetId
      outEnvelopeId = outOp.envelope_id
    }

    if (outEnvelopeId === inEnvelopeId) {
      alert('Конверты перевода должны отличаться')

      return
    }

    const updatedOut = await updateSavingsOperation(outOp.id, {
      envelope_id: outEnvelopeId,
      amount: -nextAmount,
      currency,
      description: comment,
      created_at: createdAt,
    })

    if (!updatedOut) return

    const updatedIn = await updateSavingsOperation(inOp.id, {
      envelope_id: inEnvelopeId,
      amount: nextAmount,
      currency,
      description: comment,
      created_at: createdAt,
    })

    if (!updatedIn) return

    closeDialog()
    setSelected(null)
    await reload()
  }

  const handleDeleteSelected = async () => {
    if (!selected) return

    if (
      !confirm('Удалить выбранную операцию? Это действие нельзя отменить.')
    ) {
      return
    }

    const relatedId = selected.related_operation_id
    const isTransfer =
      selected.operation_type === 'TRANSFER_OUT' ||
      selected.operation_type === 'TRANSFER_IN'

    const okPrimary = await deleteSavingsOperation(selected.id)

    if (!okPrimary) return

    if (isTransfer && relatedId) {
      await deleteSavingsOperation(relatedId)
    }

    setSelected(null)
    await reload()
  }

  const relatedEnvelopeLabel = (operation: SavingsOperation) => {
    if (
      operation.operation_type !== 'TRANSFER_OUT' &&
      operation.operation_type !== 'TRANSFER_IN'
    ) {
      return ''
    }

    if (!operation.related_operation_id) return ''

    const related = operationsById.get(operation.related_operation_id)

    if (!related) return ''

    const otherName =
      envelopeNameById.get(related.envelope_id) ?? related.envelope_id

    return operation.operation_type === 'TRANSFER_OUT'
      ? `в ${otherName}`
      : `из ${otherName}`
  }

  const amountBody = (operation: SavingsOperation) => {
    const sign = operation.amount > 0 ? '+' : ''
    const color =
      operation.amount > 0
        ? 'text-green-700'
        : operation.amount < 0
          ? 'text-red-700'
          : ''

    return (
      <span className={color}>
        {sign}
        {formatMoney(operation.amount)} {operation.currency}
      </span>
    )
  }

  const dialogHeader = editingOperation
    ? 'Редактировать'
    : dialogMode
      ? dialogTitleByMode[dialogMode]
      : ''

  if (loading || !envelope) {
    return (
      <div className="h-dvh p-5">
        <div className="w-full md:w-1/2 mx-auto text-sm text-surface-600">
          Загрузка…
        </div>
      </div>
    )
  }

  return (
    <div className="h-dvh p-5 overflow-y-auto">
      <div className="w-full md:w-1/2 mx-auto">
        <div className="flex-b">
          <h1 className="text-3xl font-bold m-0 mb-4 min-w-0 truncate">
            {envelope.name}
          </h1>
          <div className="flex items-center shrink-0">
            <Button
              icon="pi pi-pencil"
              rounded
              text
              aria-label="Редактировать конверт"
              onClick={() =>
                navigate('/savings/edit', {
                  state: { envelopeId, fromView: true },
                })
              }
            />
            <Button
              icon="pi pi-backward"
              rounded
              text
              aria-label="Назад"
              className="transform translate-x-[16px]"
              onClick={() => navigate('/savings')}
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="text-5xl font-bold">{formatMoney(balance)} руб</div>
          <div className="mt-2 text-sm text-surface-600">баланс конверта</div>
          {envelope.description && (
            <div className="mt-3 text-sm text-surface-600 whitespace-pre-wrap">
              {envelope.description}
            </div>
          )}
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <Button
            severity="success"
            label="Внести"
            className="w-full"
            onClick={() => openDialog('deposit')}
          />
          <Button
            severity="warning"
            label="Снять"
            className="w-full"
            onClick={() => openDialog('withdraw')}
          />
          <Button
            severity="info"
            label="Переместить"
            className="w-full"
            onClick={() => openDialog('transfer')}
          />
        </div>

        <div className="mb-3 flex items-center gap-1">
          <Button
            icon="pi pi-pencil"
            rounded
            text
            disabled={!selected}
            aria-label="Редактировать операцию"
            onClick={() => selected && openEditDialog(selected)}
          />
          <Button
            icon="pi pi-trash"
            rounded
            text
            severity="danger"
            disabled={!selected}
            aria-label="Удалить операцию"
            onClick={() => {
              void handleDeleteSelected()
            }}
          />
        </div>

        <DataTable
          value={operations}
          dataKey="id"
          selectionMode="single"
          selection={selected}
          onSelectionChange={(e) =>
            setSelected(e.value as SavingsOperation | null)
          }
          metaKeySelection={false}
          emptyMessage="Пока нет операций"
          size="small"
          className="text-sm"
        >
          <Column
            header="Дата"
            body={(row: SavingsOperation) => formatDateTime(row.created_at)}
          />
          <Column
            header="Тип"
            body={(row: SavingsOperation) =>
              operationTypeLabel(row.operation_type)
            }
          />
          <Column header="Сумма" body={amountBody} />
          <Column
            header="Комментарий"
            body={(row: SavingsOperation) => row.description ?? ''}
          />
          <Column header="Перевод" body={relatedEnvelopeLabel} />
        </DataTable>
      </div>

      <Dialog
        header={dialogHeader}
        visible={dialogMode !== null}
        onHide={closeDialog}
        className="w-[min(100%,28rem)]"
        modal
      >
        <div className="space-y-6 pt-2">
          <FloatLabel className="w-full">
            <Calendar
              inputId="operation-date"
              value={operationDate}
              onChange={(e) => setOperationDate((e.value as Date | null) ?? new Date())}
              showIcon
              hourFormat="24"
              showTime
              dateFormat="dd.mm.yy"
              className="w-full"
            />
            <label htmlFor="operation-date">Дата</label>
          </FloatLabel>

          <CurrencyRates
            views={rateViews}
            loading={ratesLoading}
            date={rates?.date}
            selectedCode={selectedCurrency}
            onSelect={setSelectedCurrency}
          />

          <FloatLabel className="w-full">
            <InputNumber
              id="operation-amount"
              value={amount}
              onChange={(e) => setAmount(e.value ?? null)}
              mode="decimal"
              min={0}
              minFractionDigits={0}
              maxFractionDigits={0}
              className="w-full"
            />
            <label htmlFor="operation-amount">
              Сумма
              {selectedCurrency ? ` (${selectedCurrency})` : ' (руб)'}
            </label>
          </FloatLabel>

          {dialogMode === 'transfer' && (
            <FloatLabel className="w-full">
              <Dropdown
                inputId="transfer-target"
                value={targetEnvelopeId}
                onChange={(e) => setTargetEnvelopeId(e.value as string | null)}
                options={
                  editingOperation?.operation_type === 'TRANSFER_IN'
                    ? [
                        {
                          label:
                            envelopeNameById.get(envelopeId) ?? 'Текущий конверт',
                          value: envelopeId,
                        },
                        ...transferTargets.filter((t) => t.value !== envelopeId),
                      ]
                    : transferTargets
                }
                placeholder="Куда"
                className="w-full"
              />
              <label htmlFor="transfer-target">Куда</label>
            </FloatLabel>
          )}

          <FloatLabel className="w-full">
            <InputTextarea
              id="operation-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full"
              autoResize
            />
            <label htmlFor="operation-description">Комментарий</label>
          </FloatLabel>

          <Button
            severity="success"
            label="Сохранить"
            className="w-full"
            loading={saving}
            onClick={() => {
              void handleSubmitOperation()
            }}
          />
        </div>
      </Dialog>
    </div>
  )
}
