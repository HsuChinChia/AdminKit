<template>
  <Doughnut :data="chartData" :options="chartOptions" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { useUiStore } from '@/stores/ui'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{ labels: string[]; datasets: any[] }>()
const ui    = useUiStore()

const chartData    = computed(() => ({ labels: props.labels, datasets: props.datasets }))
const chartOptions = computed(() => ({
  responsive: true,
  cutout: '72%',
  plugins: { legend: { display: false }, tooltip: {
    backgroundColor: ui.theme === 'dark' ? '#1e293b' : '#ffffff',
    titleColor: ui.theme === 'dark' ? '#e2e8f0' : '#1e293b',
    bodyColor:  ui.theme === 'dark' ? '#94a3b8' : '#475569',
    borderColor: ui.theme === 'dark' ? '#334155' : '#e2e8f0',
    borderWidth: 1, padding: 10, cornerRadius: 8,
  }},
}))
</script>
