import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroBg from '@/assets/hero-bg.jpg';

const Hero: React.FC = () => {
  return (
    <section className="relative min-h-[80vh] md:min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="Luxurious Pakistani fabric"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4">
        <div className="max-w-2xl animate-slide-up">
          <span className="inline-block px-4 py-1.5 bg-accent/20 text-accent rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
            Premium Unstitched Suits
          </span>
          
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6">
            Elegance in Every
            <span className="block text-gradient-gold mt-2">Thread & Stitch</span>
          </h1>
          
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 leading-relaxed max-w-lg">
            Discover our exclusive collection of unstitched suits crafted with the finest Pakistani fabrics and timeless designs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild variant="gold" size="xl">
              <Link to="/collections?gender=female">
                Shop Women's Collection
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="gold" size="xl">
              <Link to="/collections?gender=male">
                Shop Men's Collection
              </Link>
            </Button>
          </div>

          {/* Trust Badge */}
          <div className="mt-12 flex items-center gap-8 text-primary-foreground/80">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-serif font-bold text-accent">100%</span>
              <span className="text-sm">Genuine<br/>Fabrics</span>
            </div>
            <div className="w-px h-10 bg-primary-foreground/20" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-serif font-bold text-accent">COD</span>
              <span className="text-sm">Cash on<br/>Delivery</span>
            </div>
            <div className="w-px h-10 bg-primary-foreground/20 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-2xl font-serif font-bold text-accent">PK</span>
              <span className="text-sm">Nationwide<br/>Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
