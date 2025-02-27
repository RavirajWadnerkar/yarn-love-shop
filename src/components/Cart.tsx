
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, X, Plus, Minus } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Updated with new publishable key
const stripePromise = loadStripe("pk_live_51Qvr3DRp21S7mUMfGProFXRVuylcOVfG15HnqW1EJHmS4MmrQ0t817D7EPqdzwa55iRJF8sjQE75EXxA6lql4kE4008jq0xA4g");

const Cart = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { state, removeFromCart, updateQuantity } = useCart();
  const cartRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the cart to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Prevent body scrolling when cart is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe failed to initialize.");

      // Format the items for the checkout session
      const lineItems = state.items.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      }));

      console.log('Sending items to checkout:', lineItems);

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { items: lineItems }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data?.session_id) {
        throw new Error('No session ID received from the server');
      }

      console.log('Received session ID:', data.session_id);

      const result = await stripe.redirectToCheckout({
        sessionId: data.session_id,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error: any) {
      console.error('Error in checkout:', error);
      toast({
        title: "Checkout Error",
        description: error.message || "Something went wrong during checkout.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <ShoppingCart className="h-5 w-5" />
        {state.items.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-primary text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
            {state.items.length}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Mobile overlay */}
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />
          
          {/* Cart container */}
          <div 
            ref={cartRef}
            className="fixed inset-x-0 bottom-0 top-auto sm:absolute sm:right-0 sm:left-auto sm:top-full sm:bottom-auto w-full sm:w-96 max-w-full sm:max-w-md bg-white rounded-t-lg sm:rounded-lg shadow-lg z-50 mx-auto sm:mr-0 sm:mt-2"
            style={{ maxHeight: '80vh', overflowY: 'auto' }}
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pt-2">
                <h3 className="text-lg font-semibold">Shopping Cart</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {state.items.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Your cart is empty</p>
              ) : (
                <>
                  <div className="space-y-4 pb-4" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {state.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between space-x-4"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-gray-500">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              updateQuantity(item.id, Math.max(0, item.quantity - 1))
                            }
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span>{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t sticky bottom-0 bg-white">
                    <div className="flex justify-between mb-4">
                      <span className="font-medium">Total:</span>
                      <span className="font-medium">
                        ${state.total.toFixed(2)}
                      </span>
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleCheckout}
                      disabled={isLoading}
                    >
                      {isLoading ? "Processing..." : "Checkout"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
