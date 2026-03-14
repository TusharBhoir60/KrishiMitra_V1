const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const authApi = {
  register: async (data) => {
    await delay(800);
    return { data: { token: 'mock-jwt-token', user: { _id: '123', name: data.name || 'Demo User', phone: data.phone || '9999999999', role: data.role || 'farmer', isVerified: true, location: { state: 'Maharashtra', district: 'Pune' } } } };
  },
  login: async (data) => {
    await delay(800);
    let role = 'farmer';
    const email = data.email?.toLowerCase() || '';
    if (email.includes('admin')) role = 'admin';
    else if (email.includes('buyer')) role = 'buyer';
    else if (email.includes('transporter') || email.includes('driver')) role = 'transporter';
    
    return { 
      data: { 
        token: 'mock-jwt-token', 
        user: { 
          _id: 'user123', 
          name: role.charAt(0).toUpperCase() + role.slice(1) + ' Demo', 
          email: email, 
          phone: '9999999999', 
          role: role, 
          isVerified: true, 
          location: { state: 'Maharashtra', district: 'Pune', village: 'Shivaji Nagar' }, 
          rating: 4.8,
          completedOrders: 24
        } 
      } 
    };
  },
  getMe: async () => {
    await delay(400);
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return { data: { data: user || { _id: 'user123', name: 'Demo User', role: 'farmer', isVerified: true, location: { district: 'Pune' } } } };
  },
  updateProfile: async (data) => {
    await delay(500);
    return { data: { ...data } };
  }
};
