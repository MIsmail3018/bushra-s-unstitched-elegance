import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const FeaturedCollections: React.FC = () => {
  const { data: collections, isLoading } = useQuery({
    queryKey: ['featured-collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('is_featured', true)
        .limit(3);
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="py-16 md:py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16 animate-slide-up">
          <span className="text-sm font-medium text-accent uppercase tracking-wider">
            Curated for You
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-3">
            Featured Collections
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Explore our handpicked collections featuring the most exquisite designs and premium fabrics.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[4/5] w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : collections && collections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {collections.map((collection, index) => (
              <Link
                key={collection.id}
                to={`/collections/${collection.id}`}
                className="group relative overflow-hidden rounded-lg bg-card shadow-soft hover:shadow-elegant transition-all duration-500 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="aspect-[4/5] overflow-hidden">
                  {collection.image_url ? (
                    <img
                      src={collection.image_url}
                      alt={collection.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      <span className="font-serif text-4xl text-primary/30">
                        {collection.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-primary-foreground translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <span className="text-xs font-medium uppercase tracking-wider text-accent">
                    {collection.gender === 'female' ? 'Women' : 'Men'}
                  </span>
                  <h3 className="font-serif text-xl md:text-2xl font-semibold mt-1">
                    {collection.name}
                  </h3>
                  <p className="text-sm text-primary-foreground/80 mt-2 line-clamp-2">
                    {collection.description}
                  </p>
                  <div className="flex items-center gap-2 mt-4 text-accent">
                    <span className="text-sm font-medium">Explore Collection</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No featured collections yet. Check back soon!</p>
            <Link
              to="/collections"
              className="inline-flex items-center gap-2 mt-4 text-primary font-medium hover:underline"
            >
              Browse All Collections
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            to="/collections"
            className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
          >
            View All Collections
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCollections;
