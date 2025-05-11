import { useQuery } from "@tanstack/react-query";
import { TrainingData } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";

export function TrainingStats() {
  const { data: trainingData, isLoading } = useQuery<TrainingData[]>({
    queryKey: ['/api/training'],
  });
  
  // Calculate training metrics
  const trainingCount = trainingData?.length || 0;
  const accuracyScore = "75%"; // Placeholder - would be calculated based on actual model performance
  const lastTrainingDate = trainingData && trainingData.length > 0
    ? new Date(trainingData[trainingData.length - 1].timestamp)
    : new Date();
  
  const formattedLastTrainingDate = lastTrainingDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  return (
    <Card className="mb-6 p-4 bg-gray-50 rounded-lg">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {isLoading ? (
                <div className="loading-spinner mx-auto h-6 w-6 border-2 border-primary-600 rounded-full border-t-transparent"></div>
              ) : (
                trainingCount
              )}
            </div>
            <div className="text-sm text-gray-500">Training Examples</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{accuracyScore}</div>
            <div className="text-sm text-gray-500">Accuracy Score</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{formattedLastTrainingDate}</div>
            <div className="text-sm text-gray-500">Last Training Session</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
