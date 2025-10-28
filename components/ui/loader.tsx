import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoaderProps {
  variant?: 'classic' | 'spiral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Loader({ variant = 'classic', size = 'md', className }: LoaderProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16'
  };

  if (variant === 'spiral') {
    return <SpiralLoader size={size} className={className} />;
  }

  return (
    <div className={cn(
      "border-primary flex animate-spin items-center justify-center rounded-full border-4 border-t-transparent",
      sizeClasses[size],
      className
    )} />
  );
}

function SpiralLoader({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const dots = 8;
  const radius = size === 'sm' ? 12 : size === 'md' ? 20 : 28;
  const dotSize = size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-3 w-3' : 'h-4 w-4';
  const containerSize = size === 'sm' ? 'h-8 w-8' : size === 'md' ? 'h-16 w-16' : 'h-24 w-24';

  return (
    <div className={cn("relative", containerSize, className)}>
      {[...Array(dots)].map((_, index) => {
        const angle = (index / dots) * (2 * Math.PI);
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);

        return (
          <motion.div
            key={index}
            className={cn("absolute rounded-full bg-primary", dotSize)}
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: (index / dots) * 1.5,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
}

// Export individual components for backward compatibility
export { default as ClassicLoader } from './classic-loader';
export { default as SpiralLoaderComponent } from './spiral-loader';
