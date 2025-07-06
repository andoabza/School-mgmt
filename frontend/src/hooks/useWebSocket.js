import { useEffect, useState, useCallback } from 'react';

export default function useWebSocket() {
  const [notifications, setNotifications] = useState([]);
  const [ws, setWs] = useState(null);

  const connectWebSocket = useCallback(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // console.error('No token found in localStorage');
    const websocket = new WebSocket(`ws://localhost:3000/ws?token=${token}`);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setNotifications(prev => [...prev, message]);
      } catch (error) {
      setWs(null);
        
        console.error('Error parsing WebSocket message:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setWs(null);
      // Attempt to reconnect after a delay
      setTimeout(connectWebSocket, 15000);
    };
  return websocket;
    }
      return;

  }, []);

  useEffect(() => {
    const websocket = connectWebSocket();

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [connectWebSocket]);

  return { notifications, isConnected: !!ws };
}
