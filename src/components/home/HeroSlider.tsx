import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import useEmblaCarousel from 'embla-carousel-react';
import heroBg from '@/assets/hero-bg.jpg';

interface SlideData {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  gender: 'male' | 'female';
}

const HeroSlider: React.FC = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    duration: 30,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Fetch featured collections
  const { data: collections } = useQuery({
    queryKey: ['hero-collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('id, name, description, image_url, gender')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data as SlideData[];
    },
  });

  // Default slides if no collections available
  const defaultSlides: SlideData[] = [
    {
      id: 'default-women',
      name: 'Women\'s Collection',
      description: 'Discover our exclusive collection of unstitched suits crafted with the finest Pakistani fabrics and timeless designs.',
      image_url: heroBg,
      gender: 'female',
    },
    {
      id: 'default-men',
      name: 'Men\'s Collection',
      description: 'Premium shalwar kameez and formal wear designed for the modern Pakistani gentleman.',
      image_url: null,
      gender: 'male',
    },
  ];

  const slides = collections && collections.length > 0 ? collections : defaultSlides;

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Auto-play
  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 6000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <section className="relative min-h-[80vh] md:min-h-[90vh] overflow-hidden">
      {/* Carousel Container */}
      <div className="absolute inset-0" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide, index) => (
            <div 
              key={slide.id} 
              className="flex-[0_0_100%] min-w-0 relative h-full"
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={slide.image_url || heroBg}
                  alt={slide.name}
                  className="w-full h-full object-cover transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-hero" />
              </div>

              {/* Content */}
              <div className="relative h-full flex items-center">
                <div className="container mx-auto px-4 md:px-8 lg:px-16">
                  <div 
                    className={`max-w-2xl transition-all duration-700 ${
                      selectedIndex === index 
                        ? 'opacity-100 translate-y-0' 
                        : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: selectedIndex === index ? '300ms' : '0ms' }}
                  >
                    <span className="inline-block px-4 py-1.5 bg-accent/20 text-accent rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
                      {slide.gender === 'female' ? 'Women\'s Collection' : 'Men\'s Collection'}
                    </span>
                    
                    <h1 
                      className={`font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6 transition-all duration-700 ${
                        selectedIndex === index 
                          ? 'opacity-100 translate-y-0' 
                          : 'opacity-0 translate-y-8'
                      }`}
                      style={{ transitionDelay: selectedIndex === index ? '400ms' : '0ms' }}
                    >
                      {slide.name}
                    </h1>
                    
                    {slide.description && (
                      <p 
                        className={`text-lg md:text-xl text-primary-foreground/90 mb-8 leading-relaxed max-w-lg transition-all duration-700 ${
                          selectedIndex === index 
                            ? 'opacity-100 translate-y-0' 
                            : 'opacity-0 translate-y-8'
                        }`}
                        style={{ transitionDelay: selectedIndex === index ? '500ms' : '0ms' }}
                      >
                        {slide.description}
                      </p>
                    )}
                    
                    <div 
                      className={`transition-all duration-700 ${
                        selectedIndex === index 
                          ? 'opacity-100 translate-y-0' 
                          : 'opacity-0 translate-y-8'
                      }`}
                      style={{ transitionDelay: selectedIndex === index ? '600ms' : '0ms' }}
                    >
                      <Button asChild variant="gold" size="xl">
                        <Link to={slide.id.startsWith('default-') 
                          ? `/collections?gender=${slide.gender}` 
                          : `/collections?collection=${slide.id}`
                        }>
                          View Collection
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 md:w-14 md:h-14 rounded-full bg-background/10 backdrop-blur-md border border-primary-foreground/20 text-primary-foreground flex items-center justify-center hover:bg-background/20 transition-all duration-300 hover:scale-110 group"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6 md:h-7 md:w-7 group-hover:-translate-x-0.5 transition-transform" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 md:w-14 md:h-14 rounded-full bg-background/10 backdrop-blur-md border border-primary-foreground/20 text-primary-foreground flex items-center justify-center hover:bg-background/20 transition-all duration-300 hover:scale-110 group"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6 md:h-7 md:w-7 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`transition-all duration-300 ${
              selectedIndex === index 
                ? 'w-8 h-2 bg-accent rounded-full' 
                : 'w-2 h-2 bg-primary-foreground/40 rounded-full hover:bg-primary-foreground/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Trust Badges */}
      <div className="absolute bottom-8 right-4 md:right-8 z-10 hidden lg:flex items-center gap-6 text-primary-foreground/80">
        <div className="flex items-center gap-2 bg-background/10 backdrop-blur-md rounded-lg px-4 py-2 border border-primary-foreground/10">
          <span className="text-xl font-serif font-bold text-accent">100%</span>
          <span className="text-xs">Genuine<br/>Fabrics</span>
        </div>
        <div className="flex items-center gap-2 bg-background/10 backdrop-blur-md rounded-lg px-4 py-2 border border-primary-foreground/10">
          <span className="text-xl font-serif font-bold text-accent">COD</span>
          <span className="text-xs">Cash on<br/>Delivery</span>
        </div>
        <div className="flex items-center gap-2 bg-background/10 backdrop-blur-md rounded-lg px-4 py-2 border border-primary-foreground/10">
          <span className="text-xl font-serif font-bold text-accent">PK</span>
          <span className="text-xs">Nationwide<br/>Delivery</span>
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;
