import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Icon } from "@iconify/react";

interface MetricsCardProps {
  label: string;
  value: number;
  change?: number;
  icon: string;
}

const MetricsCard = ({ label, value, change, icon }: MetricsCardProps) => {
  return (
    <Card className="bg-white shadow-none border-none py-3">
      <CardHeader className="flex flex-row items-center space-y-0 gap-x-4">
        <div className="p-2 bg-secondary rounded-full">
          <Icon icon={icon} className="text-xl text-primary" />
        </div>
        <CardTitle className=" font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent className="mt-0 flex items-center justify-between">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {change !== undefined && (
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
        )}
      </CardContent>
    </Card>
  );
};

export default MetricsCard;
