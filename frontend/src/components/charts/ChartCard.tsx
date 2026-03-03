// src/components/charts/ChartCard.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {subtitle ? (
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
