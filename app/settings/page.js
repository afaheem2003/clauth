'use client';

import { useState, useEffect } from 'react';
import { useRouter }           from 'next/navigation';
import { useSession }          from 'next-auth/react';

const RE_USERNAME = /^[a-zA-Z0-9_]{3,20}$/;          // 3-20 chars, letters / numbers / _

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router   = useRouter();

  const [raw , setRaw]  = useState('');
  const [err , setErr]  = useState('');
  const [busy, setBusy] = useState(false);

  /* pre-fill current username once session is ready */
  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.push('/login');
    } else {
      setRaw(session.user.displayName ?? session.user.name ?? '');
    }
  }, [status, session, router]);

  /* save handler */
  async function save() {
    const handle = raw.trim().toLowerCase();

    if (!RE_USERNAME.test(handle)) {
      setErr('Username must be 3-20 characters (letters, numbers or underscore).');
      return;
    }

    setBusy(true);
    setErr('');

    try {
      /* uniqueness check */
      const chk = await fetch(`/api/username?u=${encodeURIComponent(handle)}`, { cache: 'no-store' });
      const { exists } = await chk.json();
      if (exists) throw new Error('That username is already taken.');

      /* persist */
      const res  = await fetch('/api/username', {
        method : 'POST',
        headers: { 'Content-Type':'application/json' },
        body   : JSON.stringify({ username: handle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      /* immediately refresh NextAuth cookie/session */
      if (typeof update === 'function') {
        await update({ displayName: handle });      // <- auth callback listens for this
      }

      router.refresh();                             // re-render RSC using the session
    } catch (e) {
      setErr(e.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  /* loading splash */
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold">Loading…</p>
      </div>
    );
  }

  /* UI */
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Account&nbsp;Settings
          </h1>

          <label className="block text-gray-700 font-semibold mb-2">
            Display&nbsp;Name&nbsp;/&nbsp;Username
          </label>

          <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden mb-4">
            <span className="px-3 text-gray-500 select-none">@</span>
            <input
              value={raw}
              onChange={e => setRaw(e.target.value)}
              placeholder="your_handle"
              className="flex-1 py-3 pr-3 text-gray-800 placeholder-gray-400 focus:outline-none"
            />
          </div>

          {err && <p className="text-red-600 text-sm mb-4">{err}</p>}

          <div className="flex flex-col sm:flex-row sm:space-x-4">
            <button
              onClick={save}
              disabled={busy}
              className="mb-4 sm:mb-0 px-6 py-3 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-700 transition"
            >
              {busy ? 'Saving…' : 'Save Changes'}
            </button>

            <button
              onClick={() => alert('Delete account not implemented')}
              className="px-6 py-3 rounded-lg bg-red-700 text-white font-semibold hover:bg-red-800 transition"
            >
              Delete&nbsp;Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
