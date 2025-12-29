import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name is required').optional(),
});

type AuthFormData = z.infer<typeof authSchema>;

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const isSignUp = searchParams.get('mode') === 'signup';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(data.email, data.password, {
          full_name: data.fullName,
        });
        
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Email already registered', {
              description: 'Please sign in instead.',
            });
          } else {
            throw error;
          }
        } else {
          toast.success('Account created!', {
            description: 'Welcome to Bushra\'s Collection.',
          });
          navigate('/');
        }
      } else {
        const { error } = await signIn(data.email, data.password);
        
        if (error) {
          if (error.message.includes('Invalid login')) {
            toast.error('Invalid credentials', {
              description: 'Please check your email and password.',
            });
          } else {
            throw error;
          }
        } else {
          toast.success('Welcome back!');
          navigate('/');
        }
      }
    } catch (error: any) {
      toast.error('Authentication failed', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout showFooter={false}>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <h1 className="font-serif text-2xl font-bold text-primary">
                Bushra's Collection
              </h1>
            </Link>
            <h2 className="font-serif text-xl font-semibold text-foreground mt-6">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-muted-foreground mt-2">
              {isSignUp
                ? 'Join us to shop premium unstitched suits'
                : 'Sign in to your account'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Your name"
                  {...register('fullName')}
                  className={errors.fullName ? 'border-destructive' : ''}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName.message}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            {isSignUp ? (
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <Link to="/auth" className="text-primary font-medium hover:underline">
                  Sign In
                </Link>
              </p>
            ) : (
              <p className="text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/auth?mode=signup" className="text-primary font-medium hover:underline">
                  Create Account
                </Link>
              </p>
            )}
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            You can also checkout as a guest without creating an account.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Auth;
