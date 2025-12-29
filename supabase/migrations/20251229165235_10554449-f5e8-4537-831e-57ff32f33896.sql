-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, role)
);

-- Create gender enum
CREATE TYPE public.gender_type AS ENUM ('female', 'male');

-- Create collections table
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  gender gender_type NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create suit_pieces enum
CREATE TYPE public.suit_pieces_type AS ENUM ('2-piece', '3-piece');

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
  gender gender_type NOT NULL,
  fabric_type TEXT,
  suit_pieces suit_pieces_type DEFAULT '3-piece',
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0 NOT NULL,
  description TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create product_images table
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create order_status enum
CREATE TYPE public.order_status_type AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  city TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  order_status order_status_type DEFAULT 'pending' NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_order DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create cart_items table for persistent cart
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT cart_user_or_session CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'phone_number', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User roles: Only admins can view all, users can view their own
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Collections: Public read, admin write
CREATE POLICY "Anyone can view collections" ON public.collections FOR SELECT USING (true);
CREATE POLICY "Admins can manage collections" ON public.collections FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Products: Public read, admin write
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Product images: Public read, admin write
CREATE POLICY "Anyone can view product images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Admins can manage product images" ON public.product_images FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Orders: Users can view their own orders, admins can view all
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Order items: Same as orders
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage order items" ON public.order_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Cart items: Users can manage their own cart, guests use session_id
CREATE POLICY "Users can view own cart" ON public.cart_items FOR SELECT USING (auth.uid() = user_id OR session_id IS NOT NULL);
CREATE POLICY "Users can manage own cart" ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id OR session_id IS NOT NULL);
CREATE POLICY "Users can update own cart" ON public.cart_items FOR UPDATE USING (auth.uid() = user_id OR session_id IS NOT NULL);
CREATE POLICY "Users can delete from own cart" ON public.cart_items FOR DELETE USING (auth.uid() = user_id OR session_id IS NOT NULL);

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Storage policies
CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admins can upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update product images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete product images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));