import * as React from 'react';
import { cn } from '@/lib/utils';

function CardImpl(
  { className, ...props }: React.HTMLAttributes<HTMLDivElement>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return <div ref={ref} className={cn('glass-panel rounded-lg text-card-foreground shadow-sm', className)} {...props} />;
}
const Card = React.forwardRef(CardImpl);
Card.displayName = 'Card';

function CardHeaderImpl(
  { className, ...props }: React.HTMLAttributes<HTMLDivElement>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />;
}
const CardHeader = React.forwardRef(CardHeaderImpl);
CardHeader.displayName = 'CardHeader';

function CardTitleImpl(
  { className, ...props }: React.HTMLAttributes<HTMLHeadingElement>,
  ref: React.ForwardedRef<HTMLParagraphElement>
) {
  return (
    <h3
      ref={ref}
      className={cn('font-display text-xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
}
const CardTitle = React.forwardRef(CardTitleImpl);
CardTitle.displayName = 'CardTitle';

function CardDescriptionImpl(
  { className, ...props }: React.HTMLAttributes<HTMLParagraphElement>,
  ref: React.ForwardedRef<HTMLParagraphElement>
) {
  return <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />;
}
const CardDescription = React.forwardRef(CardDescriptionImpl);
CardDescription.displayName = 'CardDescription';

function CardContentImpl(
  { className, ...props }: React.HTMLAttributes<HTMLDivElement>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />;
}
const CardContent = React.forwardRef(CardContentImpl);
CardContent.displayName = 'CardContent';

function CardFooterImpl(
  { className, ...props }: React.HTMLAttributes<HTMLDivElement>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />;
}
const CardFooter = React.forwardRef(CardFooterImpl);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };