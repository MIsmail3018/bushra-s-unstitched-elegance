import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="font-serif text-xl md:text-2xl font-semibold text-primary">
              Bushra's Collection
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/collections"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Collections
            </Link>
            <Link
              to="/collections?gender=female"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Women
            </Link>
            <Link
              to="/collections?gender=male"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Men
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Cart */}
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-gold text-[10px] font-bold flex items-center justify-center text-accent-foreground">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {user ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/orders">My Orders</Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin">Admin Dashboard</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/auth">Sign In</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/auth?mode=signup">Create Account</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-3">
              <Link
                to="/collections"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                All Collections
              </Link>
              <Link
                to="/collections?gender=female"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Women's Collection
              </Link>
              <Link
                to="/collections?gender=male"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Men's Collection
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
