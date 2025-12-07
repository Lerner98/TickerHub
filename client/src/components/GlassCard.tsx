import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'primary' | 'secondary' | 'accent' | 'none';
}

export function GlassCard({ 
  children, 
  className, 
  hover = true,
  glow = 'none' 
}: GlassCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-visible bg-card/60 backdrop-blur-md border-card-border/50",
        hover && "transition-all duration-300",
        hover && "glass-hover",
        glow === 'primary' && "border-primary/20",
        glow === 'secondary' && "border-secondary/20",
        glow === 'accent' && "border-accent/20",
        className
      )}
    >
      {glow !== 'none' && (
        <div className={cn(
          "absolute -inset-[1px] rounded-lg opacity-0 transition-opacity duration-300 -z-10 blur-sm",
          glow === 'primary' && "bg-gradient-to-r from-primary/20 to-secondary/20 group-hover:opacity-100",
          glow === 'secondary' && "bg-secondary/20 group-hover:opacity-100",
          glow === 'accent' && "bg-accent/20 group-hover:opacity-100"
        )} />
      )}
      {children}
    </Card>
  );
}
