import { useAuth } from "@/context/AuthContext";
import { InstructorDashboard } from "@/components/instructor/InstructorDashboard";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";

export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === "Instructor") {
    return <InstructorDashboard />;
  }

  return <StudentDashboard />;
}
