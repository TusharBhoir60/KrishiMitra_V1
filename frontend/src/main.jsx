import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { store } from './store';
import { BuyerCartProvider } from './context/BuyerCartContext';
import { OrderProvider } from './context/OrderContext';
import { LanguageProvider } from './context/LanguageContext';
import App from './App';
import './index.css';
import { setCredentials, logout, updateUser } from './store/slices/authSlice';
import { authApi } from './api/endpoints/authApi';

// Hydration Logic
const hydrateAuth = async () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      store.dispatch(setCredentials({ user, token }));

      const response = await authApi.getMe();
      if (response.data) {
        store.dispatch(updateUser(response.data));
      }
    } catch (error) {
      if (error.response?.status === 401) {
        store.dispatch(logout());
      }
    }
  }
};

hydrateAuth().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <BuyerCartProvider>
          <OrderProvider>
            <LanguageProvider>
              <App />
            </LanguageProvider>
          </OrderProvider>
        </BuyerCartProvider>
      </I18nextProvider>
    </Provider>
  );
});
