import { isAdminAuthenticated } from "@/lib/auth";
import AdminLogin from "./AdminLogin";
import AdminTasks from "./AdminTasks";
import AdminOperations from "./AdminOperations";
import AdminVoting from "./AdminVoting";
import AdminBetting from "./AdminBetting";
import AdminDashboard from "./AdminDashboard";
import AdminQuestions from "./AdminQuestions";

export default async function AdminPage() {
  return await isAdminAuthenticated() ? <main className="admin-shell"><AdminTasks /><AdminOperations /><AdminVoting /><AdminBetting /><AdminQuestions /><AdminDashboard /></main> : <AdminLogin />;
}
