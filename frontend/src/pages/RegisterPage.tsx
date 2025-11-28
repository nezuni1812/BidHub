import { RegisterForm } from "@/components/auth/register-form"
import { Navigation } from "@/components/navigation"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <RegisterForm />
      </div>
    </div>
  )
}
