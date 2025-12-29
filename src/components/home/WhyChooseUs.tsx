import React from 'react';
import { Truck, Shield, Sparkles, CreditCard } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'Premium Fabrics',
    description: 'Carefully selected high-quality materials from trusted Pakistani manufacturers.',
  },
  {
    icon: Truck,
    title: 'Nationwide Delivery',
    description: 'Fast and reliable shipping to all major cities across Pakistan.',
  },
  {
    icon: CreditCard,
    title: 'Cash on Delivery',
    description: 'Pay securely when your order arrives at your doorstep.',
  },
  {
    icon: Shield,
    title: 'Quality Guaranteed',
    description: 'Every piece is inspected to ensure it meets our high standards.',
  },
];

const WhyChooseUs: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16 animate-slide-up">
          <span className="text-sm font-medium text-accent uppercase tracking-wider">
            Our Promise
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mt-3">
            Why Choose Us
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="text-center p-6 rounded-lg bg-primary-foreground/5 hover:bg-primary-foreground/10 transition-colors duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/20 flex items-center justify-center">
                <feature.icon className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-3">
                {feature.title}
              </h3>
              <p className="text-primary-foreground/70 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
