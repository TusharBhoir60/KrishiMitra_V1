import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { notificationsApi } from '../api/endpoints/notificationsApi';
import { setUnreadCount } from '../store/slices/notificationSlice';

export const useNotifications = () => {
  const dispatch = useDispatch();
  const unreadCount = useSelector((state) => state.notifications.unreadCount);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await notificationsApi.getUnreadCount();
        dispatch(setUnreadCount(response.data?.count || 0));
      } catch (error) {
        console.error('Failed to fetch notification count:', error);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);

    return () => clearInterval(interval);
  }, [dispatch]);

  return { unreadCount };
};
