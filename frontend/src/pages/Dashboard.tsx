import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { BookOpen, Award, BarChart2 } from "lucide-react";

export default function Dashboard() {
  const stats = [
    { label: "Enrolled Courses", value: "3", icon: BookOpen, color: "text-blue-600" },
    { label: "Certificates Earned", value: "1", icon: Award, color: "text-green-600" },
    { label: "Overall Progress", value: "65%", icon: BarChart2, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6 select-none">
      <PageHeader
        title="Student Dashboard"
        description="Welcome back, continue your learning journey."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Recent Learning Activity</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center text-sm text-zinc-450 dark:text-zinc-500">
          No recent activity or logs available.
        </CardContent>
      </Card>
    </div>
  );
}
