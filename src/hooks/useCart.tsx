import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  function updateLocalStorage(cart: Product[]) {
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
  }

  const addProduct = async (productId: number) => {
    try {
      const product = await (await api.get(`/products/${productId}`)).data;
      const productExistsInCart = cart.find(
        (product) => product.id === productId
      );

      if (productExistsInCart) {
        const amount = productExistsInCart.amount + 1;
        return updateProductAmount({
          productId,
          amount,
        });
      }
      const newCart = [...cart, { ...product, amount: 1 }];

      updateLocalStorage(newCart);
      setCart(newCart);
    } catch {
      toast.error('Erro na adição do produto');
      toast.error('Quantidade solicitada fora de estoque');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const findProduct = cart.find((product) => product.id === productId);

      if (!findProduct) {
        return toast.error('Erro na remoção do produto');
      }

      const newCart = cart.filter((product) => product.id !== productId);

      updateLocalStorage(newCart);
      setCart(newCart);
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const Stock: Stock = await (await api.get(`/stock/${productId}`)).data;

      if (amount > Stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (amount < 1) {
        return;
      }

      const updateAmountProduct = cart.filter((product) => {
        if (product.id === productId) {
          product.amount = amount;
        }

        return product;
      });

      updateLocalStorage(updateAmountProduct);
      setCart(updateAmountProduct);
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
