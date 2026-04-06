import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, Clock, Truck, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const statusConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  pending: { icon: Clock, label: 'Pending', color: 'text-yellow-600 bg-yellow-50' },
  confirmed: { icon: Package, label: 'Confirmed', color: 'text-blue-600 bg-blue-50' },
  shipped: { icon: Truck, label: 'Shipped', color: 'text-purple-600 bg-purple-50' },
  delivered: { icon: CheckCircle, label: 'Delivered', color: 'text-green-600 bg-green-50' },
  cancelled: { icon: XCircle, label: 'Cancelled', color: 'text-red-600 bg-red-50' },
};

const Orders: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_name,
            quantity,
            price_at_order
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="font-serif text-2xl font-bold text-foreground mb-2">
              Sign In to View Orders
            </h1>
            <p className="text-muted-foreground mb-6">
              Please sign in to view your order history.
            </p>
            <Button asChild variant="gold">
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-8">
          My Orders
        </h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.order_status] || statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <div
                  key={order.id}
                  className="bg-card border border-border rounded-lg p-4 md:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Placed on {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                      <StatusIcon className="h-4 w-4" />
                      {status.label}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-foreground">
                          {item.product_name} × {item.quantity}
                        </span>
                        <span className="text-muted-foreground">
                          {formatPrice(item.price_at_order * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border">
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-serif text-lg font-bold text-primary">
                        {formatPrice(order.total_amount)}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{order.city}</p>
                      <p>{order.customer_phone}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-serif text-xl font-bold text-foreground mb-2">
              No Orders Yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Start shopping to see your orders here.
            </p>
            <Button asChild variant="gold">
              <Link to="/collections">
                Start Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Orders;
