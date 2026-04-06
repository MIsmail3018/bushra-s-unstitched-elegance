import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Minus, Plus, ShoppingBag, Truck, Shield, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import placeholderImage from '@/assets/product-placeholder-1.jpg';

import { formatPrice } from '@/lib/formatters';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images (id, image_url, is_primary, display_order),
          collections (id, name)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', product?.collection_id, product?.gender],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images (id, image_url, is_primary),
          collections (name)
        `)
        .eq('gender', product!.gender)
        .neq('id', product!.id)
        .limit(4);
      
      if (error) throw error;
      return data;
    },
    enabled: !!product,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-serif text-2xl font-bold text-foreground">Product not found</h1>
          <p className="text-muted-foreground mt-2">This product may no longer be available.</p>
          <Button asChild className="mt-6">
            <Link to="/collections">Browse Collections</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const images = product.product_images?.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)) || [];
  const currentImage = images[selectedImage]?.image_url || placeholderImage;

  const handleAddToCart = () => {
    if (product.stock_quantity <= 0) {
      toast.error('This product is out of stock');
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      imageUrl: currentImage,
      fabricType: product.fabric_type || undefined,
      suitPieces: product.suit_pieces || undefined,
    });

    toast.success('Added to cart!', {
      description: `${quantity}x ${product.name}`,
      action: {
        label: 'View Cart',
        onClick: () => navigate('/cart'),
      },
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to="/collections" className="hover:text-primary">Collections</Link>
          {product.collections && (
            <>
              <span>/</span>
              <Link to={`/collections?collection=${product.collections.id}`} className="hover:text-primary">
                {product.collections.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg bg-secondary">
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                      selectedImage === idx ? 'border-primary' : 'border-transparent hover:border-border'
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              {product.collections && (
                <span className="text-sm font-medium text-accent uppercase tracking-wider">
                  {product.collections.name}
                </span>
              )}
              <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mt-1">
                {product.name}
              </h1>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-serif text-3xl font-bold text-primary">
                {formatPrice(product.price)}
              </span>
              {product.stock_quantity <= 0 && (
                <span className="text-sm font-medium text-destructive">Out of Stock</span>
              )}
              {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
                <span className="text-sm font-medium text-accent">Only {product.stock_quantity} left</span>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {product.suit_pieces && (
                <span className="px-3 py-1 bg-secondary rounded-full text-sm font-medium">
                  {product.suit_pieces}
                </span>
              )}
              {product.fabric_type && (
                <span className="px-3 py-1 bg-secondary rounded-full text-sm font-medium">
                  {product.fabric_type}
                </span>
              )}
              <span className="px-3 py-1 bg-secondary rounded-full text-sm font-medium">
                {product.gender === 'female' ? 'Women' : 'Men'}
              </span>
            </div>

            {product.description && (
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Quantity & Add to Cart */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center border border-border rounded-md">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-secondary transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    className="p-2 hover:bg-secondary transition-colors"
                    disabled={quantity >= product.stock_quantity}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="gold"
                  size="xl"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={product.stock_quantity <= 0}
                >
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
              <div className="text-center">
                <Truck className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Nationwide Delivery</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Quality Guaranteed</p>
              </div>
              <div className="text-center">
                <Package className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Cash on Delivery</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-16 md:mt-24">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-8">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p, idx) => (
                <Link
                  key={p.id}
                  to={`/product/${p.id}`}
                  className="group block"
                >
                  <div className="aspect-[3/4] overflow-hidden rounded-lg bg-secondary mb-3">
                    <img
                      src={p.product_images?.find((i) => i.is_primary)?.image_url || p.product_images?.[0]?.image_url || placeholderImage}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {p.name}
                  </h3>
                  <p className="font-serif text-primary font-semibold">
                    {formatPrice(p.price)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetail;
