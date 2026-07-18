'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

function TabsListImpl(
  { className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
  ref: React.ForwardedRef<React.ElementRef<typeof TabsPrimitive.List>>
) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-secondary/50 p-1 text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}
const TabsList = React.forwardRef(TabsListImpl);
TabsList.displayName = TabsPrimitive.List.displayName;

function TabsTriggerImpl(
  { className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
  ref: React.ForwardedRef<React.ElementRef<typeof TabsPrimitive.Trigger>>
) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow',
        className
      )}
      {...props}
    />
  );
}
const TabsTrigger = React.forwardRef(TabsTriggerImpl);
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

function TabsContentImpl(
  { className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>,
  ref: React.ForwardedRef<React.ElementRef<typeof TabsPrimitive.Content>>
) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn('mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}
      {...props}
    />
  );
}
const TabsContent = React.forwardRef(TabsContentImpl);
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };