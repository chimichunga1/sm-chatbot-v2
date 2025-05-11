import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { TrainingData } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";

export function TrainingProgress() {
  const { data: trainingData, isLoading } = useQuery<TrainingData[]>({
    queryKey: ['/api/training'],
  });
  
  // Calculate training progress (simple percentage based on number of training examples)
  const trainingCount = trainingData?.length || 0;
  const targetTrainingCount = 200; // Example target
  const progressPercentage = Math.min(Math.round((trainingCount / targetTrainingCount) * 100), 100);
  
  return (
    <Card className="bg-white shadow">
      <CardHeader>
        <CardTitle className="text-lg font-medium leading-6 text-gray-900">Training Progress</CardTitle>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">Latest training data and model performance</p>
      </CardHeader>
      <CardContent className="px-4 py-5 sm:p-6">
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Your AI is currently trained on {trainingCount} quotes and estimates.</p>
        </div>
        <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-secondary-600 h-2.5 rounded-full" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="mt-2 flex justify-between">
          <p className="text-xs text-gray-600">Getting Started</p>
          <p className="text-xs text-gray-600">AI Trained</p>
        </div>
        <div className="mt-6">
          <Link href="/training">
            <Button className="inline-flex items-center bg-secondary-600 hover:bg-secondary-700">
              Continue Training
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
