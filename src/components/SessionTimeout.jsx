import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export default function SessionTimeout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const timeoutRef = useRef(null);

    const resetTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (user) {
            timeoutRef.current = setTimeout(() => {
                logout();
                navigate('/giris');
                alert('Oturumunuz zaman aşımına uğradı. Güvenliğiniz için çıkış yapıldı.');
            }, TIMEOUT_DURATION);
        }
    };

    useEffect(() => {
        if (!user) return;

        const events = ['mousemove', 'keydown', 'click', 'scroll'];

        const handleActivity = () => {
            resetTimeout();
        };

        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        resetTimeout(); // Initialize timer

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [user, logout, navigate]);

    return null; // This component doesn't render anything
}
