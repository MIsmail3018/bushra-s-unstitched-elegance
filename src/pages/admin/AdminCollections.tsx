import React, { useState } from 'react';
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

interface Collection {
  id: string;
  name: string;
  description: string | null;
  gender: 'female' | 'male';
  is_featured: boolean;
  image_url: string | null;
}

interface UploadedImage {
  id?: string;
  url: string;
  isPrimary: boolean;
  isNew?: boolean;
}

const AdminCollections: React.FC = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    gender: 'female' as 'female' | 'male',
    is_featured: false,
  });

  const { data: collections, isLoading } = useQuery({
    queryKey: ['admin-collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Collection[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string; image_url?: string | null }) => {
      const collectionData = {
        name: data.name,
        description: data.description || null,
        gender: data.gender,
        is_featured: data.is_featured,
        image_url: data.image_url || null,
      };

      if (data.id) {
        const { error } = await supabase
          .from('collections')
          .update(collectionData)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('collections')
          .insert(collectionData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      toast.success(editingCollection ? 'Collection updated!' : 'Collection created!');
      handleClose();
    },
    onError: (error: any) => {
      toast.error('Failed to save collection', { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('collections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      toast.success('Collection deleted!');
    },
    onError: (error: any) => {
      toast.error('Failed to delete collection', { description: error.message });
    },
  });

  const handleClose = () => {
    setIsOpen(false);
    setEditingCollection(null);
    setImages([]);
    setFormData({ name: '', description: '', gender: 'female', is_featured: false });
  };

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description || '',
      gender: collection.gender,
      is_featured: collection.is_featured || false,
    });
    // Load existing image
    if (collection.image_url) {
      setImages([{ url: collection.image_url, isPrimary: true, isNew: false }]);
    } else {
      setImages([]);
    }
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const imageUrl = images.length > 0 ? images[0].url : null;
    saveMutation.mutate({ ...formData, id: editingCollection?.id, image_url: imageUrl });
  };

  return (
    <AdminLayout title="Collections">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">Manage your product collections</p>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="gold">
              <Plus className="h-4 w-4 mr-2" />
              Add Collection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCollection ? 'Edit Collection' : 'Add New Collection'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Collection Image</Label>
                <ImageUpload
                  images={images}
                  onImagesChange={setImages}
                  maxImages={1}
                  folder="collections"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
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
              <div className="space-y-2">
                <Label>Gender</Label>
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
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_featured: checked === true })
                  }
                />
                <Label htmlFor="is_featured">Featured on homepage</Label>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="gold" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingCollection ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : collections && collections.length > 0 ? (
        <div className="grid gap-4">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg"
            >
              {collection.image_url && (
                <div className="w-16 h-16 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                  <img src={collection.image_url} alt={collection.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{collection.name}</h3>
                  {collection.is_featured && (
                    <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full">
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {collection.gender === 'female' ? 'Women' : 'Men'}
                  {collection.description && ` • ${collection.description}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(collection)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this collection?')) {
                      deleteMutation.mutate(collection.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No collections yet. Create your first collection!
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCollections;
