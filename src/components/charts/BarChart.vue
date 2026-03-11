<template>
  <div class="relative w-full h-full">
    <Bar
      v-if="chartData.datasets.length"
      :data="chartData"
      :options="chartOptions"
    />
    <div v-else class="absolute inset-0 flex items-center justify-center text-slate-400">
      <Loader2 class="w-6 h-6 animate-spin" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  type ChartOptions,
  type ChartData
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import { Loader2 } from 'lucide-vue-next'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const props = defineProps<{
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
    borderRadius?: number
  }[]
}>()

const chartData = computed<ChartData<'bar'>>(() => ({
  labels: props.labels,
  datasets: props.datasets.map(ds => ({
    ...ds,
    backgroundColor: ds.backgroundColor || '#3b82f6',
    borderRadius: ds.borderRadius || 4,
  }))
}))

const chartOptions = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        boxWidth: 8,
        padding: 20,
        font: {
          family: "'Inter', sans-serif",
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleFont: { size: 13, family: "'Inter', sans-serif" },
      bodyFont: { size: 12, family: "'Inter', sans-serif" },
      padding: 10,
      cornerRadius: 8,
      displayColors: false,
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(148, 163, 184, 0.1)',
        tickLength: 0
      },
      border: {
        display: false
      },
      ticks: {
        font: { family: "'Inter', sans-serif", size: 11 },
        color: '#64748b',
        padding: 8
      }
    },
    x: {
      grid: {
        display: false,
        tickLength: 0
      },
      border: {
        display: false
      },
      ticks: {
        font: { family: "'Inter', sans-serif", size: 11 },
        color: '#64748b',
        padding: 8
      }
    }
  }
}))
</script>
