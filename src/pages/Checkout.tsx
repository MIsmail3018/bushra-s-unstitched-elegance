import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import placeholderImage from '@/assets/product-placeholder-1.jpg';

const pakistanCities = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 
  'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
  'Hyderabad', 'Abbottabad', 'Bahawalpur', 'Sargodha', 'Sukkur',
  'Larkana', 'Sheikhupura', 'Jhang', 'Rahim Yar Khan', 'Gujrat',
  'Mardan', 'Kasur', 'Dera Ghazi Khan', 'Sahiwal', 'Okara'
];

const checkoutSchema = z.object({
  fullName: z.string().min(3, 'Name must be at least 3 characters').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15).regex(/^[\d\s+-]+$/, 'Invalid phone number'),
  address: z.string().min(10, 'Please provide a complete address').max(500),
  city: z.string().min(2, 'Please select or enter a city').max(100),
  notes: z.string().max(500).optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { user, signUp } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<string | null>(null);
  const [accountCreated, setAccountCreated] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: '',
      email: user?.email || '',
      phone: '',
      address: '',
      city: '',
      notes: '',
    },
  });

  React.useEffect(() => {
    if (items.length === 0 && !orderComplete) {
      navigate('/cart');
    }
  }, [items.length, orderComplete, navigate]);

  if (items.length === 0 && !orderComplete) {
    return null;
  }

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);

    try {
      let userId = user?.id || null;

      // If guest checkout, create account and wait for authentication
      if (!user) {
        const tempPassword = Array.from(crypto.getRandomValues(new Uint8Array(24)))
          .map(b => b.toString(36).padStart(2, '0'))
          .join('')
          .slice(0, 20) + 'A1!';
        
        const { error: signUpError } = await signUp(data.email, tempPassword, {
          full_name: data.fullName,
          phone_number: data.phone,
        });

        if (signUpError) {
          // If user already exists, try to sign in instead
          if (signUpError.message.includes('already registered')) {
            toast.error('An account with this email already exists. Please sign in first.');
            setIsSubmitting(false);
            return;
          }
          throw signUpError;
        }
        
        setAccountCreated(true);

        // Wait for session to be established (with retry)
        let retries = 0;
        const maxRetries = 5;
        while (retries < maxRetries) {
          const { data: authData } = await supabase.auth.getSession();
          if (authData?.session?.user?.id) {
            userId = authData.session.user.id;
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
          retries++;
        }

        if (!userId) {
          throw new Error('Failed to authenticate. Please try again.');
        }
      }

      // Create order - user_id is now guaranteed to be set
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          customer_name: data.fullName,
          customer_email: data.email,
          customer_phone: data.phone,
          delivery_address: data.address,
          city: data.city,
          notes: data.notes || null,
          total_amount: totalPrice,
          order_status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.name,
        quantity: item.quantity,
        price_at_order: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Success!
      clearCart();
      setOrderComplete(order.id);
      
      toast.success('Order placed successfully!', {
        description: 'You will receive a confirmation soon.',
      });

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error('Failed to place order', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderComplete) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2">
              Order Placed Successfully!
            </h1>
            <p className="text-muted-foreground mb-4">
              Thank you for shopping with Bushra's Collection.
            </p>
            <p className="text-sm bg-secondary p-4 rounded-lg mb-6">
              <span className="font-medium">Order ID:</span> {orderComplete.slice(0, 8).toUpperCase()}
            </p>
            
            {accountCreated && (
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-medium text-foreground mb-1">
                  ✨ Account Created!
                </p>
                <p className="text-xs text-muted-foreground">
                  An account has been created for you. You can sign in using your email to track your orders.
                </p>
              </div>
            )}

            <div className="text-left bg-card border border-border rounded-lg p-4 mb-6">
              <h3 className="font-medium text-foreground mb-2">What's Next?</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• We'll confirm your order shortly</li>
                <li>• Your order will be shipped within 2-3 business days</li>
                <li>• Payment: Cash on Delivery</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/orders')}>
                Track Order
              </Button>
              <Button variant="gold" onClick={() => navigate('/collections')}>
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </button>

        <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-8">
          Checkout
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="font-serif text-lg font-semibold text-foreground mb-4">
                  Delivery Information
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="Your full name"
                      {...register('fullName')}
                      className={errors.fullName ? 'border-destructive' : ''}
                    />
                    {errors.fullName && (
                      <p className="text-xs text-destructive">{errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      {...register('email')}
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="03XX XXXXXXX"
                      {...register('phone')}
                      className={errors.phone ? 'border-destructive' : ''}
                    />
                    {errors.phone && (
                      <p className="text-xs text-destructive">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="e.g., Lahore"
                      list="cities"
                      {...register('city')}
                      className={errors.city ? 'border-destructive' : ''}
                    />
                    <datalist id="cities">
                      {pakistanCities.map((city) => (
                        <option key={city} value={city} />
                      ))}
                    </datalist>
                    {errors.city && (
                      <p className="text-xs text-destructive">{errors.city.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="address">Delivery Address *</Label>
                  <Textarea
                    id="address"
                    placeholder="House/Flat #, Street, Area, Landmark..."
                    rows={3}
                    {...register('address')}
                    className={errors.address ? 'border-destructive' : ''}
                  />
                  {errors.address && (
                    <p className="text-xs text-destructive">{errors.address.message}</p>
                  )}
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special instructions for delivery..."
                    rows={2}
                    {...register('notes')}
                  />
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                <h2 className="font-serif text-lg font-semibold text-foreground mb-2">
                  💰 Payment Method
                </h2>
                <p className="text-muted-foreground">
                  <strong>Cash on Delivery (COD)</strong> - Pay when you receive your order.
                </p>
              </div>

              {!user && (
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                  <p className="text-sm text-foreground">
                    <strong>Note:</strong> An account will be created for you using your email address so you can track your orders.
                  </p>
                </div>
              )}

              <Button
                type="submit"
                variant="gold"
                size="xl"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  `Place Order • ${formatPrice(totalPrice)}`
                )}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
              <h2 className="font-serif text-lg font-semibold text-foreground mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-secondary">
                      <img
                        src={item.imageUrl || placeholderImage}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-semibold text-primary">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-primary">Free</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="font-serif text-primary">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
