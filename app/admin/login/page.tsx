import LoginCard from "@/components/ui/login-card-1";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Login Card */}
      <div className="relative z-10">
        <LoginCard />
      </div>
    </div>
  );
}

