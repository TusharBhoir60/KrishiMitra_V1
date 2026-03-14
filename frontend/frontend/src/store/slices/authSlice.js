import { createSlice } from '@reduxjs/toolkit';

const getStoredAuth = () => {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');

  if (!token || !userRaw) {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
    };
  }

  try {
    const user = JSON.parse(userRaw);
    return {
      user,
      token,
      isAuthenticated: Boolean(token && user),
    };
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    return {
      user: null,
      token: null,
      isAuthenticated: false,
    };
  }
};

const initialState = {
  ...getStoredAuth(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('role', user?.role || '');
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
  },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
