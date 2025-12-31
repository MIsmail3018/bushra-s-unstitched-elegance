import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import ImageUpload from '@/components/admin/ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import placeholderImage from '@/assets/product-placeholder-1.jpg';

interface UploadedImage {
  id?: string;
  url: string;
  isPrimary: boolean;
  isNew?: boolean;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const AdminProducts: React.FC = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    gender: 'female' as 'female' | 'male',
    fabric_type: '',
    suit_pieces: '3-piece' as '2-piece' | '3-piece',
    collection_id: '',
    is_featured: false,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`*, collections(name), product_images(id, image_url, is_primary)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: collections } = useQuery({
    queryKey: ['all-collections'],
    queryFn: async () => {
      const { data, error } = await supabase.from('collections').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string; images: UploadedImage[] }) => {
      const productData = {
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price),
        stock_quantity: parseInt(data.stock_quantity),
        gender: data.gender,
        fabric_type: data.fabric_type || null,
        suit_pieces: data.suit_pieces,
        collection_id: data.collection_id || null,
        is_featured: data.is_featured,
      };

      let productId = data.id;

      if (data.id) {
        const { error } = await supabase.from('products').update(productData).eq('id', data.id);
        if (error) throw error;
      } else {
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single();
        if (error) throw error;
        productId = newProduct.id;
      }

      // Handle images - delete old ones that are no longer in the list
      if (data.id) {
        const existingImageIds = data.images.filter(img => img.id).map(img => img.id) as string[];
        if (existingImageIds.length > 0) {
          // Fetch all images for this product, then delete ones not in keep list
          const { data: allImages } = await supabase
            .from('product_images')
            .select('id')
            .eq('product_id', data.id);
          
          const imagesToDelete = allImages
            ?.filter(img => !existingImageIds.includes(img.id))
            .map(img => img.id) || [];
          
          if (imagesToDelete.length > 0) {
            await supabase
              .from('product_images')
              .delete()
              .in('id', imagesToDelete);
          }
        } else {
          await supabase.from('product_images').delete().eq('product_id', data.id);
        }
      }

      // Insert new images
      const newImages = data.images.filter(img => img.isNew);
      if (newImages.length > 0 && productId) {
        const imageRecords = newImages.map((img, index) => ({
          product_id: productId,
          image_url: img.url,
          is_primary: img.isPrimary,
          display_order: index,
        }));
        const { error: imgError } = await supabase.from('product_images').insert(imageRecords);
        if (imgError) throw imgError;
      }

      // Update existing images (primary status)
      const existingImages = data.images.filter(img => img.id && !img.isNew);
      for (const img of existingImages) {
        await supabase
          .from('product_images')
          .update({ is_primary: img.isPrimary })
          .eq('id', img.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(editingProduct ? 'Product updated!' : 'Product created!');
      handleClose();
    },
    onError: (error: any) => {
      toast.error('Failed to save product', { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete images first
      await supabase.from('product_images').delete().eq('product_id', id);
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted!');
    },
    onError: (error: any) => {
      toast.error('Failed to delete product', { description: error.message });
    },
  });

  const handleClose = () => {
    setIsOpen(false);
    setEditingProduct(null);
    setImages([]);
    setFormData({
      name: '',
      description: '',
      price: '',
      stock_quantity: '',
      gender: 'female',
      fabric_type: '',
      suit_pieces: '3-piece',
      collection_id: '',
      is_featured: false,
    });
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      gender: product.gender,
      fabric_type: product.fabric_type || '',
      suit_pieces: product.suit_pieces || '3-piece',
      collection_id: product.collection_id || '',
      is_featured: product.is_featured || false,
    });
    // Load existing images
    const existingImages: UploadedImage[] = (product.product_images || []).map((img: any) => ({
      id: img.id,
      url: img.image_url,
      isPrimary: img.is_primary || false,
      isNew: false,
    }));
    setImages(existingImages);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...formData, id: editingProduct?.id, images });
  };

  return (
    <AdminLayout title="Products">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">Manage your products</p>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="gold">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Product Images</Label>
                <ImageUpload
                  images={images}
                  onImagesChange={setImages}
                  maxImages={5}
                  folder="products"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (PKR) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(v) => setFormData({ ...formData, gender: v as 'female' | 'male' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Women</SelectItem>
                      <SelectItem value="male">Men</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Suit Pieces</Label>
                  <Select
                    value={formData.suit_pieces}
                    onValueChange={(v) => setFormData({ ...formData, suit_pieces: v as '2-piece' | '3-piece' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2-piece">2-piece</SelectItem>
                      <SelectItem value="3-piece">3-piece</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fabric">Fabric Type</Label>
                  <Input
                    id="fabric"
                    value={formData.fabric_type}
                    onChange={(e) => setFormData({ ...formData, fabric_type: e.target.value })}
                    placeholder="e.g., Cotton, Lawn, Chiffon"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Collection</Label>
                  <Select
                    value={formData.collection_id}
                    onValueChange={(v) => setFormData({ ...formData, collection_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {collections?.map((col) => (
                        <SelectItem key={col.id} value={col.id}>
                          {col.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_featured: checked === true })
                  }
                />
                <Label htmlFor="is_featured">Featured product</Label>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="gold" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingProduct ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : products && products.length > 0 ? (
        <div className="grid gap-4">
          {products.map((product) => {
            const primaryImage = product.product_images?.find((img: any) => img.is_primary);
            const imageUrl = primaryImage?.image_url || product.product_images?.[0]?.image_url || placeholderImage;

            return (
              <div
                key={product.id}
                className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg"
              >
                <div className="w-16 h-16 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                  <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{product.name}</h3>
                    {product.is_featured && (
                      <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full flex-shrink-0">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {product.gender === 'female' ? 'Women' : 'Men'} • {product.suit_pieces} • Stock: {product.stock_quantity}
                    {product.collections?.name && ` • ${product.collections.name}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-primary">{formatPrice(product.price)}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this product?')) {
                        deleteMutation.mutate(product.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No products yet. Add your first product!
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProducts;
