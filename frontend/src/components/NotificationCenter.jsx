import { useEffect } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import { BellIcon } from '@heroicons/react/24/outline';

export default function NotificationCenter() {
  const { notifications, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected) {
      console.log('Attempting to connect to WebSocket...');
    }
  }, [isConnected]);

  // return (
  //   <div className="notification-center text-black">
      
  //     <ul>
  //       {notifications.map((notification, index) => (
  //         <li key={index}>
  //           {notification.type === 'system' ? '⚠️' : '✉️'} 
  //           {notification.message}
          
  //         </li>

  //       ))}
  //     </ul>
  //   </div>
  // );
}


