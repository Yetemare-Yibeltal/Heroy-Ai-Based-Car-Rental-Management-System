'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

function DialogOverlayImpl(
  { className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>,
  ref: React.ForwardedRef<React.ElementRef<typeof DialogPrimitive.Overlay>>
) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        'fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    />
  );
}
const DialogOverlay = React.forwardRef(DialogOverlayImpl);
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

function DialogContentImpl(
  { className, children, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
  ref: React.ForwardedRef<React.ElementRef<typeof DialogPrimitive.Content>>
) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'glass-panel-strong fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg p-6 shadow-lg duration-200',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}
const DialogContent = React.forwardRef(DialogContentImpl);
DialogContent.displayName = DialogPrimitive.Content.displayName;

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 text-left', className)} {...props} />;
}
DialogHeader.displayName = 'DialogHeader';

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
      {...props}
    />
  );
}
DialogFooter.displayName = 'DialogFooter';

function DialogTitleImpl(
  { className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>,
  ref: React.ForwardedRef<React.ElementRef<typeof DialogPrimitive.Title>>
) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn('font-display text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
}
const DialogTitle = React.forwardRef(DialogTitleImpl);
DialogTitle.displayName = DialogPrimitive.Title.displayName;

function DialogDescriptionImpl(
  { className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>,
  ref: React.ForwardedRef<React.ElementRef<typeof DialogPrimitive.Description>>
) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}
const DialogDescription = React.forwardRef(DialogDescriptionImpl);
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};