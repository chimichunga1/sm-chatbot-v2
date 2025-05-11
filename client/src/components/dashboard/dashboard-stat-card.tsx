import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalQuotes: number;
  totalQuoteValue: number;
  quotesPercentChange: number;
  valuePercentChange: number;
}

interface DashboardStatCardProps {
  title: string;
  metricKey: keyof DashboardStats;
  percentKey: keyof DashboardStats;
  isCurrency?: boolean;
}

export function DashboardStatCard({ 
  title, 
  metricKey, 
  percentKey, 
  isCurrency = false 
}: DashboardStatCardProps) {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const value = stats?.[metricKey] || 0;
  const percentChange = stats?.[percentKey] || 0;
  const isPositive = percentChange >= 0;

  const formattedValue = isCurrency 
    ? `$${value.toLocaleString()}` 
    : value.toLocaleString();

  return (
    <div className="bg-muted/50 p-4 rounded-lg">
      <p className="text-sm text-muted-foreground">{title}</p>
      {isLoading ? (
        <div className="space-y-2 mt-1">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      ) : (
        <>
          <h3 className="text-2xl font-bold">{formattedValue}</h3>
          <p className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{percentChange}% from last month
          </p>
        </>
      )}
    </div>
  );
}