import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { Link } from "wouter";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  linkText: string;
  linkHref: string;
}

export function StatsCard({
  title,
  value,
  icon,
  iconBg,
  iconColor,
  linkText,
  linkHref,
}: StatsCardProps) {
  return (
    <Card className="bg-white overflow-hidden shadow">
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3", iconBg)}>
            <div className={cn("text-xl", iconColor)}>{icon}</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <Link href={linkHref} className="font-medium text-primary-600 hover:text-primary-500">
            {linkText} <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </Card>
  );
}
