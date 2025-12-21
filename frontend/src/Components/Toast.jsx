// src/Components/Toast.jsx
import React from 'react';
import './Toast.css';
import { useNotification } from '../Context/NotificationContext';

export default function Toast() {
    const { notification } = useNotification();

    // Nếu không có thông báo thì không render gì cả
    if (!notification) return null;

    return (
        <div className="toast-container">
            <div className="toast-message">
                <div className="toast-icon">{notification.icon || '🔔'}</div>
                <div className="toast-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.body}</p>
                </div>
            </div>
        </div>
    );
}