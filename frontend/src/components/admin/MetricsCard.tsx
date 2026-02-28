import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Icon } from "@iconify/react";

interface MetricsCardProps {
  label: string;
  value: number;
  hint?: string;
  icon: string;
}

const MetricsCard = ({ label, value, hint, icon }: MetricsCardProps) => {
  return (
    <Card className="bg-white shadow-none border-none">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className=" font-medium">{label}</CardTitle>
        <Icon icon={icon} className="text-2xl" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {hint ? <div className="mt-1 text-xs text-zinc-500">{hint}</div> : null}
      </CardContent>
    </Card>
  );
};

export default MetricsCard;
