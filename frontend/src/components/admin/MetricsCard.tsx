import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Icon } from "@iconify/react";

type MetricTone = "slate" | "blue" | "emerald" | "amber" | "rose" | "violet";

interface MetricsCardProps {
  label: string;
  value: number;
  change?: number;
  icon: string;
  tone?: MetricTone;
}

const toneClasses: Record<
  MetricTone,
  { card: string; iconWrap: string; icon: string }
> = {
  slate: {
    card: "bg-zinc-50",
    iconWrap: "bg-zinc-200",
    icon: "text-zinc-700",
  },
  blue: {
    card: "bg-blue-100",
    iconWrap: "bg-blue-300",
    icon: "text-blue-700",
  },
  emerald: {
    card: "bg-emerald-100",
    iconWrap: "bg-emerald-300",
    icon: "text-emerald-700",
  },
  amber: {
    card: "bg-amber-100",
    iconWrap: "bg-amber-300",
    icon: "text-amber-700",
  },
  rose: {
    card: "bg-rose-100",
    iconWrap: "bg-rose-300",
    icon: "text-rose-700",
  },
  violet: {
    card: "bg-violet-100",
    iconWrap: "bg-violet-300",
    icon: "text-violet-700",
  },
};

const MetricsCard = ({
  label,
  value,
  change,
  icon,
  tone = "slate",
}: MetricsCardProps) => {
  const classes = toneClasses[tone];

  return (
    <Card className={`bg-white shadow-none border-none py-3`}>
      <CardHeader className="flex flex-row items-center space-y-0 gap-x-4">
        <div className={`p-2 ${classes.iconWrap} rounded-full`}>
          <Icon icon={icon} className={`text-xl ${classes.icon}`} />
        </div>
        <CardTitle className="">{label}</CardTitle>
      </CardHeader>
      <CardContent className="mt-0 flex items-center justify-between">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {/* {change !== undefined && (
          <div className="flex items-center gap-1 font-bold">
            <Icon
              icon={change > 0 ? "mdi:arrow-up" : "mdi:arrow-down"}
              className={`text-sm ${change > 0 ? "text-green-600" : "text-red-600"}`}
            />
            <div
              className={`text-xs ${change > 0 ? "text-green-600" : "text-red-600"}`}
            >
              {change > 0 ? "+" : ""}
              {change}
            </div>
          </div>
        )} */}
      </CardContent>
    </Card>
  );
};

export default MetricsCard;
