import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, copyToClipboard } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: 'sm' | 'icon';
}

export function CopyButton({ text, className, size = 'icon' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await copyToClipboard(text);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "The value has been copied successfully.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleCopy}
      className={cn(
        "transition-all duration-200",
        copied && "text-accent",
        className
      )}
      data-testid="button-copy"
      aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
    >
      {copied ? (
        <Check className="w-4 h-4" aria-hidden="true" />
      ) : (
        <Copy className="w-4 h-4" aria-hidden="true" />
      )}
    </Button>
  );
}
