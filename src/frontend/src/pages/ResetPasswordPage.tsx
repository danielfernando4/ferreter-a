import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Restablecer Contraseña</h1>
          <p className="text-slate-500 mt-1">Ingresa tu nueva contraseña</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
