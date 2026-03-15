import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

console.log('🚀 WebSocket 練習伺服器已啟動：ws://localhost:8080');

wss.on('connection', (ws) => {
  console.log('✅ 收到新的連線');

  // 每隔 5 秒自動發送隨機數據給客戶端（模擬真實行為）
  const interval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      const mockData = {
        user: ['小明', '阿華', '美美', '大壯'][Math.floor(Math.random() * 4)],
        action: ['新增訂單', '完成付款', '申請退款', '聯絡客服'][Math.floor(Math.random() * 4)],
        amount: Math.floor(Math.random() * 10000)
      };
      
      ws.send(JSON.stringify(mockData));
      console.log('📤 已發送數據:', mockData);
    }
  }, 5000);

  ws.on('message', (message) => {
    console.log('📥 收到客戶端訊息:', message.toString());
  });

  ws.on('close', () => {
    console.log('❌ 連線已中斷');
    clearInterval(interval);
  });
});
