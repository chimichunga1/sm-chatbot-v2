import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Video, FileSpreadsheet } from "lucide-react";
import { Link } from "wouter";

export function TrainingResources() {
  return (
    <Card className="bg-white shadow overflow-hidden">
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <CardTitle className="text-lg font-medium leading-6 text-gray-900">Training Resources</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <BookOpen className="text-primary-500 h-5 w-5 mr-2" />
              <h4 className="font-medium text-gray-900">Training Guide</h4>
            </div>
            <p className="text-sm text-gray-500 mb-4">Learn how to effectively train your AI for accurate pricing estimates.</p>
            <Link href="/training/guide">
              <a className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                Read Guide <span aria-hidden="true">&rarr;</span>
              </a>
            </Link>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <Video className="text-primary-500 h-5 w-5 mr-2" />
              <h4 className="font-medium text-gray-900">Tutorial Videos</h4>
            </div>
            <p className="text-sm text-gray-500 mb-4">Watch step-by-step tutorials on optimizing your AI assistant.</p>
            <Link href="/training/videos">
              <a className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                Watch Videos <span aria-hidden="true">&rarr;</span>
              </a>
            </Link>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <FileSpreadsheet className="text-primary-500 h-5 w-5 mr-2" />
              <h4 className="font-medium text-gray-900">Bulk Upload</h4>
            </div>
            <p className="text-sm text-gray-500 mb-4">Import historical quote data to accelerate training progress.</p>
            <Link href="/training/import">
              <a className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                Import Data <span aria-hidden="true">&rarr;</span>
              </a>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
