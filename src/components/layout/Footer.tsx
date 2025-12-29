import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-semibold">Bushra's Collection</h3>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Premium unstitched suits featuring the finest Pakistani fabrics and exquisite craftsmanship.
            </p>
            <div className="flex gap-4 pt-2">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-serif text-lg font-medium">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/collections" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  All Collections
                </Link>
              </li>
              <li>
                <Link to="/collections?gender=female" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Women's Suits
                </Link>
              </li>
              <li>
                <Link to="/collections?gender=male" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Men's Suits
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h4 className="font-serif text-lg font-medium">Customer Service</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/orders" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <span className="text-sm text-primary-foreground/80">
                  Shipping across Pakistan
                </span>
              </li>
              <li>
                <span className="text-sm text-primary-foreground/80">
                  Cash on Delivery Only
                </span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-serif text-lg font-medium">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-primary-foreground/80">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>+92 300 1234567</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-primary-foreground/80">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>info@bushrascollection.pk</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-primary-foreground/80">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Lahore, Pakistan</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-primary-foreground/60">
              © {new Date().getFullYear()} Bushra's Collection. All rights reserved.
            </p>
            <p className="text-sm text-primary-foreground/60">
              Payment: Cash on Delivery (COD) Only
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
