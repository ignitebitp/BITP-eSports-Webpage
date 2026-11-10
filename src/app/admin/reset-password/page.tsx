import { Suspense } from 'react';
import ResetPasswordForm from './reset-password-form';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="mx-auto flex w-full max-w-lg flex-grow items-start px-4 py-16 sm:px-6" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
