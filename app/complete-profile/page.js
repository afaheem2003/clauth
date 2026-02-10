'use client';

import { useState, useEffect } from 'react';
import { useRouter }           from 'next/navigation';
import { useSession }          from 'next-auth/react';

const RE_USERNAME = /^[a-zA-Z0-9_]{3,20}$/;   // same as API

export default function CompleteProfile() {
  const { data:session, status, update } = useSession();
  const router  = useRouter();

  const [raw , setRaw]  = useState('');
  const [err , setErr]  = useState('');
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Check if user has an existing invalid username (likely from OAuth full name)
  const hasInvalidUsername = session?.user?.displayName &&
                              !/^[a-zA-Z0-9_]{3,20}$/.test(session.user.displayName);

  /* redirect if logged-out */
  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) router.replace('/login');
  }, [status, session, router]);

  async function save(e) {
    e.preventDefault();
    const handle = raw.trim().toLowerCase();

    if (!RE_USERNAME.test(handle)) {
      setErr('3-20 chars, letters/numbers/_ only.');
      return;
    }

    setBusy(true); setErr('');
    try {
      /* quick existence check */
      const res = await fetch(`/api/username?u=${encodeURIComponent(handle)}`);
      const { exists } = await res.json();
      if (exists) throw new Error('Username already taken.');

      /* persist */
      const up = await fetch('/api/username', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body  : JSON.stringify({ username: handle })
      });
      if (!up.ok) throw new Error((await up.json()).error);

      // Show waiting state while JWT refreshes
      setBusy(false);
      setWaiting(true);

      // Poll session until displayName is updated
      const checkSession = async () => {
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        return sessionData?.user?.displayName === handle;
      };

      // Poll every 500ms, max 10 attempts (5 seconds)
      let attempts = 0;
      const maxAttempts = 10;
      const pollInterval = setInterval(async () => {
        attempts++;
        const isUpdated = await checkSession();

        if (isUpdated) {
          clearInterval(pollInterval);
          setWaiting(false);
          setSuccess(true);

          // Redirect after success animation
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        } else if (attempts >= maxAttempts) {
          // Fallback: just redirect anyway after max attempts
          clearInterval(pollInterval);
          window.location.href = '/';
        }
      }, 500);

    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-full mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-black mb-3 tracking-tight">
            {hasInvalidUsername ? 'Update Your Username' : 'Set Your Username'}
          </h1>
          <p className="text-gray-600">
            {hasInvalidUsername ? 'Choose a new username to continue' : 'Choose a unique handle for your account'}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          {waiting ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                <svg className="w-10 h-10 text-gray-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-black mb-2">Please Wait...</h2>
              <p className="text-gray-600">Setting up your account</p>
            </div>
          ) : success ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6 animate-scale-in">
                <svg className="w-10 h-10 text-white animate-checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-black mb-2">All Set!</h2>
              <p className="text-gray-600">Your username has been created</p>
            </div>
          ) : (
            <>
              {hasInvalidUsername && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-sm text-gray-700">
                    Your current username contains invalid characters. Please choose a new username with only letters, numbers, and underscores.
                  </p>
                </div>
              )}

              <form onSubmit={save} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
                  <span className="px-3 text-lg text-gray-500 select-none">@</span>
                  <input
                    type="text"
                    value={raw}
                    onChange={(e) => setRaw(e.target.value)}
                    placeholder="your_handle"
                    autoFocus
                    className="flex-1 py-3 pr-3 text-base text-black placeholder-gray-400 focus:outline-none bg-transparent"
                    maxLength={30}
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                3-20 characters · Letters, numbers, and underscores only
              </p>
            </div>

            {err && (
              <div className="p-3 bg-gray-50 border border-gray-300 rounded-md">
                <p className="text-sm text-gray-900">{err}</p>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                disabled={busy}
                className="w-full py-3 px-4 rounded-md bg-black text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Continue'
                )}
              </button>

              <button
                type="button"
                onClick={() => router.replace('/login')}
                className="w-full py-3 px-4 rounded-md bg-white text-gray-700 font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Log Out
              </button>
            </div>
          </form>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <p className="text-center text-xs text-gray-500 mt-6">
            Your username will be visible to other users
          </p>
        )}
      </div>

      <style jsx>{`
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes checkmark {
          0% {
            stroke-dasharray: 0, 100;
          }
          100% {
            stroke-dasharray: 100, 100;
          }
        }
        :global(.animate-scale-in) {
          animation: scale-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        :global(.animate-checkmark) {
          stroke-dasharray: 0, 100;
          animation: checkmark 0.5s 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
