import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

const BuyerCartContext = createContext(null);

const CART_STORAGE_KEY = 'krishimitra-buyer-cart';
const ORDERS_STORAGE_KEY = 'krishimitra-buyer-orders';

const readStorage = (key) => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
};

const createOrderStatus = (index) => {
  const statuses = ['Order Placed', 'Packed', 'Out for Delivery', 'Delivered'];
  return statuses[index % statuses.length];
};

export const BuyerCartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => readStorage(CART_STORAGE_KEY));
  const [orders, setOrders] = useState(() => readStorage(ORDERS_STORAGE_KEY));

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  const addToCart = (product, quantity = 1) => {
    const safeQuantity = Math.max(product.minOrderQty || 1, quantity);

    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item._id === product._id);

      if (existingItem) {
        return currentItems.map((item) =>
          item._id === product._id
            ? {
                ...item,
                quantity: Math.min(item.availableQty || safeQuantity, item.quantity + safeQuantity),
              }
            : item
        );
      }

      return [
        ...currentItems,
        {
          ...product,
          quantity: Math.min(product.availableQty || safeQuantity, safeQuantity),
        },
      ];
    });

    toast.success('Added to cart');
  };

  const updateCartQuantity = (productId, quantity) => {
    setCartItems((currentItems) =>
      currentItems.map((item) => {
        if (item._id !== productId) {
          return item;
        }

        const nextQuantity = Math.max(item.minOrderQty || 1, Math.min(item.availableQty || quantity, quantity));
        return { ...item, quantity: nextQuantity };
      })
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((currentItems) => currentItems.filter((item) => item._id !== productId));
    toast.success('Removed from cart');
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const checkout = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return [];
    }

    const createdAt = new Date().toISOString();
    const newOrders = cartItems.map((item, index) => ({
      id: `KM-${Date.now()}-${index + 1}`,
      productId: item._id,
      cropName: item.cropName,
      farmerName: item.farmer?.name || 'Verified Farmer',
      farmerLocation: item.farmer?.location?.district || 'Rural India',
      image: item.images?.[0]?.url || '',
      pricePerKg: item.pricePerKg,
      quantity: item.quantity,
      totalAmount: item.quantity * item.pricePerKg,
      orderDate: createdAt,
      deliveryStatus: createOrderStatus((orders.length + index) % 4),
    }));

    setOrders((currentOrders) => [...newOrders, ...currentOrders]);
    clearCart();
    toast.success('Order placed successfully');
    return newOrders;
  };

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.pricePerKg * item.quantity, 0),
    [cartItems]
  );

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const value = {
    cartItems,
    orders,
    cartTotal,
    cartCount,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    checkout,
  };

  return <BuyerCartContext.Provider value={value}>{children}</BuyerCartContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useBuyerCart = () => {
  const context = useContext(BuyerCartContext);

  if (!context) {
    throw new Error('useBuyerCart must be used within a BuyerCartProvider');
  }

  return context;
};