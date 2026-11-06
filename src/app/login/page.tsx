import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-center text-3xl font-semibold">Finance Tracker</h1>
      <LoginForm />
    </main>
  );
}
