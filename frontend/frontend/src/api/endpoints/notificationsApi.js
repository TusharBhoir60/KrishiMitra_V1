const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const notificationsApi = {
  getNotifications: async () => {
    await delay(300);
    return { data: { data: [
      { _id: 'n1', title: 'New Order Request', message: 'Buyer Demo wants to purchase 100kg of Mangoes', type: 'order', isRead: false, createdAt: new Date().toISOString() },
      { _id: 'n2', title: 'Price Alert', message: 'Onion prices are trending up in your district', type: 'alert', isRead: true, createdAt: new Date().toISOString() }
    ] } };
  },
  markAsRead: async (id) => {
    await delay(300); return { data: { success: true } };
  },
  markAllAsRead: async () => {
    await delay(300); return { data: { success: true } };
  }
};
