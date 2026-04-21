import { Construction } from "lucide-react";

const Maintenance = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center space-y-6">
        <Construction className="w-16 h-16 text-muted-foreground mx-auto" />
        <h1 className="text-3xl font-bold text-foreground">Test Site</h1>
        <p className="text-muted-foreground text-lg">
          This is a test environment. The site is currently not available to the public.
        </p>
      </div>
    </div>
  );
};

export default Maintenance;
