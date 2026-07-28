import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Ferretería</h1>
        <p className="text-slate-500">Recuperación de contraseña</p>
      </div>

      <div className="w-full max-w-md">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
