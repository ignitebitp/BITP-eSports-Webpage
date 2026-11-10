'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isInvitation, setIsInvitation] = useState(false);
  const [checkingToken, setCheckingToken] = useState(Boolean(token));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!token) return;
    let active = true;
    void fetch(`/api/admin/password-reset/complete?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'This account link is invalid or expired.');
        if (active) setIsInvitation(data.purpose === 'INVITE');
      })
      .catch((tokenError: unknown) => {
        if (active) setError(tokenError instanceof Error ? tokenError.message : 'Could not validate this account link.');
      })
      .finally(() => {
        if (active) setCheckingToken(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(token ? '/api/admin/password-reset/complete' : '/api/admin/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(token ? { token, password, ...(isInvitation ? { name, username } : {}) } : { email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'The request could not be completed.');
      setNotice(data.message || 'Password updated. You can return to sign in.');
      setPassword('');
      setConfirmation('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'The request could not be completed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-grow items-start px-4 py-16 sm:px-6">
      <form onSubmit={submit} className="w-full space-y-5 border border-[#33343b] bg-[#0c0e14] p-6 sm:p-8">
        <div>
          <p className="font-label-mono-sm text-xs uppercase text-[#cdf200]">Admin // Account access</p>
          <h1 className="mt-2 font-headline-lg uppercase text-white">{token ? isInvitation ? 'Set up your account' : 'Set a password' : 'Reset password'}</h1>
          <p className="mt-2 font-body-sm text-[#8f96a3]">{token ? isInvitation ? 'Choose your username, display name, and password.' : 'Choose a new password for your account.' : 'Enter your account email and, if it is registered, a secure reset link will be sent.'}</p>
        </div>
        {error && <p role="alert" className="border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>}
        {notice && <p role="status" className="border border-[#637500] bg-[#1d1f26] p-3 text-sm text-[#cdf200]">{notice}</p>}
        {token ? (
          <>
            {checkingToken ? <p className="text-sm text-[#8f96a3]">Checking your secure invitation…</p> : null}
            {isInvitation && !checkingToken && (
              <>
                <label className="block space-y-1 text-sm text-[#8f96a3]">
                  Display name
                  <input required maxLength={100} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="w-full border border-[#33343b] bg-[#191b22] px-3 py-2 text-white" />
                </label>
                <label className="block space-y-1 text-sm text-[#8f96a3]">
                  Username
                  <input required minLength={3} maxLength={30} pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,29}" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="w-full border border-[#33343b] bg-[#191b22] px-3 py-2 text-white" />
                  <span className="block">3–30 letters, numbers, dots, underscores, or hyphens. You can use it to sign in.</span>
                </label>
              </>
            )}
            <label className="block space-y-1 text-sm text-[#8f96a3]">
              New password
              <input required minLength={14} maxLength={72} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full border border-[#33343b] bg-[#191b22] px-3 py-2 text-white" />
            </label>
            <label className="block space-y-1 text-sm text-[#8f96a3]">
              Confirm password
              <input required minLength={14} maxLength={72} type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full border border-[#33343b] bg-[#191b22] px-3 py-2 text-white" />
            </label>
          </>
        ) : (
          <label className="block space-y-1 text-sm text-[#8f96a3]">
            Email
            <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full border border-[#33343b] bg-[#191b22] px-3 py-2 text-white" />
          </label>
        )}
        <button disabled={busy || checkingToken || (Boolean(token) && password !== confirmation)} className="w-full bg-[#cdf200] px-4 py-3 font-label-caps font-bold uppercase text-[#0a0b0e] disabled:opacity-50">
          {busy ? 'Submitting…' : token ? isInvitation ? 'Create account' : 'Set password' : 'Send reset link'}
        </button>
        <a href="/admin" className="block text-center text-sm text-[#8f96a3] hover:text-white">Return to sign in</a>
      </form>
    </main>
  );
}
