import React from 'react';
import { Header } from '@/components/layout/Header';

export default function ConsumptionLogBookPage() {
  return (
    <div className="min-h-screen">
      <Header
        title="Consumption Log Book"
        subtitle="Track and review utility and fuel consumption."
      />
      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          Consumption module is not yet configured. This page is a placeholder and can be wired to your consumption logs and reports.
        </div>
      </div>
    </div>
  );
}

