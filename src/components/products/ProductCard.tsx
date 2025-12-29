import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import placeholderImage from '@/assets/product-placeholder-1.jpg';

interface ProductImage {
  id: string;
  image_url: string;
  is_primary: boolean;
}

interface Collection {
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  fabric_type: string | null;
  suit_pieces: string | null;
  gender: string;
  stock_quantity: number;
  product_images: ProductImage[];
  collections: Collection | null;
}

interface ProductCardProps {
  product: Product;
  index?: number;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
  const { addItem } = useCart();
  
  const primaryImage = product.product_images?.find((img) => img.is_primary);
  const imageUrl = primaryImage?.image_url || product.product_images?.[0]?.image_url || placeholderImage;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.stock_quantity <= 0) {
      toast.error('This product is out of stock');
      return;
    }
    
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl,
      fabricType: product.fabric_type || undefined,
      suitPieces: product.suit_pieces || undefined,
    });
    
    toast.success('Added to cart!', {
      description: product.name,
    });
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative overflow-hidden rounded-lg bg-card shadow-soft hover:shadow-elegant transition-all duration-500">
        {/* Image */}
        <div className="aspect-[3/4] overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        </div>

        {/* Quick Add Button */}
        <Button
          variant="gold"
          size="icon"
          className="absolute bottom-4 right-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
          onClick={handleAddToCart}
          disabled={product.stock_quantity <= 0}
        >
          <ShoppingBag className="h-4 w-4" />
        </Button>

        {/* Out of Stock Badge */}
        {product.stock_quantity <= 0 && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-destructive text-destructive-foreground text-xs font-medium rounded-full">
            Out of Stock
          </div>
        )}

        {/* Gender Badge */}
        <div className="absolute top-3 right-3 px-3 py-1 bg-background/90 backdrop-blur-sm text-xs font-medium rounded-full text-foreground">
          {product.gender === 'female' ? 'Women' : 'Men'}
        </div>
      </div>

      {/* Details */}
      <div className="mt-4 space-y-1.5">
        {product.collections && (
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {product.collections.name}
          </span>
        )}
        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-serif text-lg font-semibold text-primary">
            {formatPrice(product.price)}
          </span>
          {product.suit_pieces && (
            <span className="text-xs text-muted-foreground">
              • {product.suit_pieces}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
