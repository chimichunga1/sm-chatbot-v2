import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";

interface ServerStatus {
  name: string;
  location: string;
  status: "online" | "maintenance" | "offline";
  load: number;
  memory: {
    used: number;
    total: number;
  };
}

interface SystemMetric {
  name: string;
  description: string;
  current: number;
  max: number;
  percentage: number;
  color: string;
}

interface SystemStatus {
  servers: ServerStatus[];
  metrics: SystemMetric[];
}

export function SystemStatus() {
  // In a real app, fetch this from the API
  // const { data: systemStatus, isLoading } = useQuery<SystemStatus>({
  //   queryKey: ['/api/admin/system-status'],
  // });
  
  // For demo purposes, use mock data
  const systemStatus: SystemStatus = {
    servers: [
      {
        name: "Server 1",
        location: "US East",
        status: "online",
        load: 40,
        memory: {
          used: 4,
          total: 10,
        },
      },
      {
        name: "Server 2",
        location: "Europe",
        status: "online",
        load: 25,
        memory: {
          used: 2.5,
          total: 10,
        },
      },
      {
        name: "Server 3",
        location: "Asia",
        status: "maintenance",
        load: 0,
        memory: {
          used: 0,
          total: 10,
        },
      },
    ],
    metrics: [
      {
        name: "Database Storage",
        description: "17/25 GB",
        current: 17,
        max: 25,
        percentage: 68,
        color: "bg-blue-500",
      },
      {
        name: "API Rate Limit",
        description: "4,200/10,000",
        current: 4200,
        max: 10000,
        percentage: 42,
        color: "bg-purple-500",
      },
      {
        name: "Vercel AI Processing",
        description: "38/50 GB",
        current: 38,
        max: 50,
        percentage: 76,
        color: "bg-red-500",
      },
    ],
  };
  
  // Function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-600";
      case "maintenance":
        return "text-yellow-600";
      case "offline":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };
  
  return (
    <Card className="bg-white shadow overflow-hidden">
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <CardTitle className="text-lg font-medium leading-6 text-gray-900">System Status</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-base font-medium text-gray-900 mb-2">AI Training Servers</h4>
            <div className="space-y-3">
              {systemStatus.servers.map((server, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm text-gray-700 mb-1">
                    <span>{server.name} ({server.location})</span>
                    <span className={getStatusColor(server.status)}>
                      {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
                    </span>
                  </div>
                  <Progress
                    value={server.load}
                    className="h-2 bg-gray-200"
                    indicatorClassName="bg-green-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Load: {server.load}%</span>
                    <span>
                      {server.memory.used}/{server.memory.total} GB Memory
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-base font-medium text-gray-900 mb-2">System Metrics</h4>
            <div className="space-y-4">
              {systemStatus.metrics.map((metric, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-700">{metric.name}</span>
                    <span className="text-sm text-gray-700">
                      {metric.percentage}% ({metric.description})
                    </span>
                  </div>
                  <Progress
                    value={metric.percentage}
                    className="h-2 bg-gray-200"
                    indicatorClassName={metric.color}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
