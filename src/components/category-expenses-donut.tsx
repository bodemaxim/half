import { Chart } from 'primereact/chart'
import { enumConfig } from '../api/consts'
import type { CategoryExpenses } from '../api/types'

type CategoryExpensesDonutProps = {
  data: CategoryExpenses
}

const excludedAnalyticsCategory = 'close_period'

const chartColors = [
  '#42A5F5',
  '#66BB6A',
  '#FFA726',
  '#AB47BC',
  '#26C6DA',
  '#EC407A',
  '#7E57C2',
  '#FFCA28',
  '#8D6E63',
  '#26A69A',
  '#5C6BC0',
  '#FF7043',
  '#9CCC65',
  '#29B6F6',
  '#EF5350',
  '#BDBDBD',
  '#78909C',
  '#D4E157',
  '#FFEE58',
  '#8BC34A',
  '#90A4AE',
  '#A1887F',
  '#7986CB',
  '#4DB6AC',
]

export const CategoryExpensesDonut = ({ data }: CategoryExpensesDonutProps) => {
  const sortedCategories = enumConfig.categories
    .filter((category) => category.value !== excludedAnalyticsCategory)
    .map((category, index) => ({
      label: category.label,
      value: data[category.value] ?? 0,
      color: chartColors[index],
    }))
    .sort((a, b) => b.value - a.value)

  const labels = sortedCategories.map((category) => category.label)
  const values = sortedCategories.map((category) => category.value)
  const colors = sortedCategories.map((category) => category.color)

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        hoverBackgroundColor: colors,
      },
    ],
  }

  const documentStyle = getComputedStyle(document.documentElement)
  const textColor = documentStyle.getPropertyValue('--text-color') || '#495057'

  const options = {
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: textColor,
        },
      },
    },
  }

  return (
    <div className="mt-6 rounded-xl border border-surface-200 p-4">
      <h2 className="mb-4 text-xl font-semibold">Траты по категориям</h2>
      <Chart type="doughnut" data={chartData} options={options} className="w-full" />
    </div>
  )
}
