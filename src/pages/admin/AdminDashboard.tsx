import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, FolderOpen, ShoppingCart, TrendingUp, Users, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';

import { formatPrice, formatCompactPrice } from '@/lib/formatters';

const STATUS_COLORS: Record<string, string> = {
  pending: 'hsl(var(--chart-1))',
  confirmed: 'hsl(var(--chart-2))',
  shipped: 'hsl(var(--chart-3))',
  delivered: 'hsl(var(--chart-4))',
  cancelled: 'hsl(var(--chart-5))',
};

const AdminDashboard: React.FC = () => {
  // Basic stats
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [productsRes, collectionsRes, ordersRes, usersRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('collections').select('id', { count: 'exact' }),
        supabase.from('orders').select('id, total_amount, created_at'),
        supabase.from('profiles').select('id', { count: 'exact' }),
      ]);

      const orders = ordersRes.data || [];
      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      
      // Calculate revenue for this month vs last month
      const now = new Date();
      const thisMonth = now.getMonth();
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      
      const thisMonthRevenue = orders
        .filter(o => new Date(o.created_at).getMonth() === thisMonth)
        .reduce((sum, o) => sum + Number(o.total_amount), 0);
      
      const lastMonthRevenue = orders
        .filter(o => new Date(o.created_at).getMonth() === lastMonth)
        .reduce((sum, o) => sum + Number(o.total_amount), 0);
      
      const revenueChange = lastMonthRevenue > 0 
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : thisMonthRevenue > 0 ? 100 : 0;

      return {
        products: productsRes.count || 0,
        collections: collectionsRes.count || 0,
        orders: orders.length,
        revenue: totalRevenue,
        customers: usersRes.count || 0,
        revenueChange,
        thisMonthRevenue,
      };
    },
  });

  // Revenue trend (last 7 days)
  const { data: revenueTrend } = useQuery({
    queryKey: ['revenue-trend'],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 6);
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .gte('created_at', sevenDaysAgo.toISOString());

      const days = eachDayOfInterval({ start: sevenDaysAgo, end: new Date() });
      
      return days.map(day => {
        const dayStart = startOfDay(day);
        const dayOrders = orders?.filter(o => {
          const orderDate = startOfDay(new Date(o.created_at));
          return orderDate.getTime() === dayStart.getTime();
        }) || [];
        
        return {
          date: format(day, 'EEE'),
          fullDate: format(day, 'MMM dd'),
          revenue: dayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0),
          orders: dayOrders.length,
        };
      });
    },
  });

  // Order status distribution
  const { data: orderStats } = useQuery({
    queryKey: ['order-stats'],
    queryFn: async () => {
      const { data: orders } = await supabase
        .from('orders')
        .select('order_status');

      const statusCounts: Record<string, number> = {};
      orders?.forEach(o => {
        statusCounts[o.order_status] = (statusCounts[o.order_status] || 0) + 1;
      });

      return Object.entries(statusCounts).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        color: STATUS_COLORS[status] || 'hsl(var(--muted))',
      }));
    },
  });

  // Top products by collection
  const { data: productsByGender } = useQuery({
    queryKey: ['products-by-gender'],
    queryFn: async () => {
      const { data: products } = await supabase
        .from('products')
        .select('gender, stock_quantity');

      const genderStats: Record<string, { count: number; stock: number }> = {};
      products?.forEach(p => {
        if (!genderStats[p.gender]) {
          genderStats[p.gender] = { count: 0, stock: 0 };
        }
        genderStats[p.gender].count++;
        genderStats[p.gender].stock += p.stock_quantity;
      });

      return Object.entries(genderStats).map(([gender, data]) => ({
        name: gender === 'female' ? 'Women' : 'Men',
        products: data.count,
        stock: data.stock,
      }));
    },
  });

  // Recent orders
  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const chartConfig = {
    revenue: { label: 'Revenue', color: 'hsl(var(--primary))' },
    orders: { label: 'Orders', color: 'hsl(var(--chart-2))' },
    products: { label: 'Products', color: 'hsl(var(--chart-1))' },
    stock: { label: 'Stock', color: 'hsl(var(--chart-3))' },
  };

  return (
    <AdminLayout title="Dashboard">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatPrice(stats?.revenue || 0)}
            </div>
            <div className="flex items-center text-xs mt-1">
              {stats?.revenueChange !== undefined && stats.revenueChange !== 0 && (
                <>
                  {stats.revenueChange > 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={stats.revenueChange > 0 ? 'text-green-500' : 'text-red-500'}>
                    {Math.abs(stats.revenueChange).toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground ml-1">vs last month</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.orders || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">All time orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Products
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.products || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In {stats?.collections || 0} collections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Customers
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.customers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered users</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Revenue Trend
            </CardTitle>
            <CardDescription>Last 7 days performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend || []}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => formatCompactPrice(value)}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [formatPrice(value), 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Order Status
            </CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStats || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {orderStats?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Inventory Overview
            </CardTitle>
            <CardDescription>Products & stock by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productsByGender || []} layout="vertical">
                  <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="products" fill="hsl(var(--chart-1))" radius={4} name="Products" />
                  <Bar dataKey="stock" fill="hsl(var(--chart-3))" radius={4} name="Stock" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest customer orders</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{order.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.city} • {format(new Date(order.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-primary">
                        {formatPrice(order.total_amount)}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        order.order_status === 'delivered' ? 'bg-green-500/20 text-green-600' :
                        order.order_status === 'shipped' ? 'bg-blue-500/20 text-blue-600' :
                        order.order_status === 'confirmed' ? 'bg-yellow-500/20 text-yellow-600' :
                        order.order_status === 'cancelled' ? 'bg-red-500/20 text-red-600' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {order.order_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No orders yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
