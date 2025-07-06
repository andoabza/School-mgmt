import React from 'react';
import { Badge, Popover, List } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import useWebSocket from '../hooks/useWebSocket';

export default function NotificationCenter() {
  const notifications = useWebSocket();
  
  const content = (
    <List
      size="small"
      dataSource={notifications}
      renderItem={item => (
        <List.Item>
          <List.Item.Meta
            title={item.title}
            description={item.message}
          />
        </List.Item>
      )}
    />
  );
  
  return (
    <Popover content={content} title="Notifications" trigger="click">
      <Badge count={notifications.length}>
        <BellOutlined style={{ fontSize: 20 }} />
      </Badge>
    </Popover>
  );
}
