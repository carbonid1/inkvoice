'use client'

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import { cn } from '@carbonid1/design-system'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

export const Tabs = ({
  className,
  orientation = 'horizontal',
  ...props
}: ComponentProps<typeof TabsPrimitive.Root>) => (
  <TabsPrimitive.Root
    data-slot="tabs"
    orientation={orientation}
    className={cn('group/tabs flex gap-2 data-[orientation=horizontal]:flex-col', className)}
    {...props}
  />
)

const tabsListVariants = cva(
  'group/tabs-list text-muted-foreground inline-flex w-fit items-center justify-center rounded-lg p-[3px] group-data-[orientation=horizontal]/tabs:h-9 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:rounded-none',
  {
    variants: {
      variant: {
        default: 'bg-muted',
        line: 'gap-1 bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

type TabsListProps = ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>

export const TabsList = ({ className, variant = 'default', ...props }: TabsListProps) => (
  <TabsPrimitive.List
    data-slot="tabs-list"
    data-variant={variant}
    className={cn(tabsListVariants({ variant }), className)}
    {...props}
  />
)

export const TabsTrigger = ({ className, ...props }: ComponentProps<typeof TabsPrimitive.Tab>) => (
  <TabsPrimitive.Tab
    data-slot="tabs-trigger"
    className={cn(
      "text-foreground/60 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring data-[active]:bg-background data-[active]:text-foreground dark:text-muted-foreground dark:hover:text-foreground dark:data-[active]:border-input dark:data-[active]:bg-input/30 dark:data-[active]:text-foreground relative inline-flex h-[calc(100%-1px)] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-1 text-xs font-medium whitespace-nowrap transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 group-data-[variant=default]/tabs-list:data-[active]:shadow-sm group-data-[variant=line]/tabs-list:data-[active]:bg-transparent group-data-[variant=line]/tabs-list:data-[active]:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      className,
    )}
    {...props}
  />
)

export const TabsContent = ({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Panel>) => (
  <TabsPrimitive.Panel
    data-slot="tabs-content"
    className={cn('flex-1 outline-none', className)}
    {...props}
  />
)
