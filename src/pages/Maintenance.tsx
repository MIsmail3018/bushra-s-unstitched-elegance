import { Clock, Mail, Phone } from "lucide-react";

const Maintenance = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Logo/Brand */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
            Bushra Haroon Collection
          </h1>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
        </div>

        {/* Coming Soon Message */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Coming Soon</span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
            We're Working on Something Beautiful
          </h2>
          
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Our new collection of premium Pakistani suits and traditional fashion is on its way. 
            Stay tuned for an exclusive shopping experience.
          </p>
        </div>

        {/* Contact Info */}
        <div className="pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">Get in touch with us</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
            <a 
              href="mailto:info@bushraharooncollection.com" 
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <Mail className="w-4 h-4" />
              info@bushraharooncollection.com
            </a>
            <a 
              href="https://wa.me/923001234567" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <Phone className="w-4 h-4" />
              WhatsApp
            </a>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
