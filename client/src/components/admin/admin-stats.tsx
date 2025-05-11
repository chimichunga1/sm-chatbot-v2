import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Users, Building, FileText, Server } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalQuotes: number;
  activeCompanies: number;
  aiProcessingUsage: string;
}

export function AdminStats() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
  });
  
  // Define stat cards
  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: <Users className="h-5 w-5" />,
      iconBg: "bg-primary-100",
      iconColor: "text-primary-600",
    },
    {
      title: "Active Companies",
      value: stats?.activeCompanies || 0,
      icon: <Building className="h-5 w-5" />,
      iconBg: "bg-secondary-100",
      iconColor: "text-secondary-600",
    },
    {
      title: "Total Quotes",
      value: stats?.totalQuotes || 0,
      icon: <FileText className="h-5 w-5" />,
      iconBg: "bg-accent-100",
      iconColor: "text-accent-600",
    },
    {
      title: "AI Processing",
      value: stats?.aiProcessingUsage || "0 GB",
      icon: <Server className="h-5 w-5" />,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
  ];
  
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="bg-white overflow-hidden shadow">
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${stat.iconBg} rounded-md p-3`}>
                <div className={stat.iconColor}>{stat.icon}</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{stat.title}</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {isLoading ? (
                        <div className="loading-spinner h-5 w-5 border-2 border-primary-600 rounded-full border-t-transparent"></div>
                      ) : (
                        typeof stat.value === "string" ? stat.value : stat.value.toLocaleString()
                      )}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
