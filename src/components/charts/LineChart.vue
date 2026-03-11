<template>
  <Line :data="chartData" :options="chartOptions" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { useUiStore } from '@/stores/ui'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const props = defineProps<{ labels: string[]; datasets: any[] }>()
const ui    = useUiStore()

const chartData    = computed(() => ({ labels: props.labels, datasets: props.datasets }))
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: true,
  plugins: { legend: { display: false }, tooltip: tooltipStyle.value },
  scales: {
    x: { grid: gridColor.value, ticks: tickStyle.value },
    y: { grid: gridColor.value, ticks: tickStyle.value },
  },
}))

const tooltipStyle = computed(() => ({
  backgroundColor: ui.theme === 'dark' ? '#1e293b' : '#ffffff',
  titleColor: ui.theme === 'dark' ? '#e2e8f0' : '#1e293b',
  bodyColor:  ui.theme === 'dark' ? '#94a3b8' : '#475569',
  borderColor: ui.theme === 'dark' ? '#334155' : '#e2e8f0',
  borderWidth: 1, padding: 10, cornerRadius: 8,
}))
const gridColor  = computed(() => ({ color: ui.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }))
const tickStyle  = computed(() => ({ color: ui.theme === 'dark' ? '#94a3b8' : '#64748b', font: { size: 12 } }))
</script>
