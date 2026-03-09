'use client'

import { Toaster as Sonner, type ToasterProps } from 'sonner'

export const Toaster = (props: ToasterProps) => (
  <Sonner theme="system" className="toaster group" position="bottom-right" {...props} />
)
