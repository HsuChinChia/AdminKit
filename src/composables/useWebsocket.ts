import { ref, onUnmounted } from 'vue'
import ReconnectingWebSocket from 'reconnecting-websocket'

export function useWebsocket(url: string, protocols?: string | string[], options: any = {}) {
  const immediate = options.immediate !== false
  const isConnected = ref(false)
  const data = ref<any>(null)
  const isError = ref(false)
  let rws: ReconnectingWebSocket | null = null

  // 啟動連線
  const connect = () => {
    if (rws) return
    rws = new ReconnectingWebSocket(url, protocols, options)

    rws.addEventListener('open', () => {
      isConnected.value = true
      isError.value = false
    })

    rws.addEventListener('message', (event) => {
      try {
        data.value = JSON.parse(event.data) // 嘗試解析 JSON
      } catch (e) {
        data.value = event.data // 否則存入純文字
      }
    })

    rws.addEventListener('close', () => {
      isConnected.value = false
    })

    rws.addEventListener('error', () => {
      isError.value = true
    })
  }

  // 傳送訊息
  const send = (message: any) => {
    if (rws && isConnected.value) {
      rws.send(typeof message === 'string' ? message : JSON.stringify(message))
    }
  }

  // 斷開連線
  const disconnect = () => {
    if (rws) {
      rws.close()
      rws = null
      isConnected.value = false
    }
  }

  onUnmounted(() => disconnect())

  if (immediate) connect()

  return { isConnected, data, isError, connect, send, disconnect }
}

