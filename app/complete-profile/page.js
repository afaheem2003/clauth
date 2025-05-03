'use client';

import { useState, useEffect } from 'react';
import { useRouter }           from 'next/navigation';
import { useSession }          from 'next-auth/react';

const RE_USERNAME = /^[a-zA-Z0-9_]{3,20}$/;   // same as API

export default function CompleteProfile() {
  const { data:session, status } = useSession();
  const router  = useRouter();

  const [raw , setRaw]  = useState('');
  const [err , setErr]  = useState('');
  const [busy, setBusy] = useState(false);

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

      router.replace('/');
    } catch (e) { setErr(e.message); }
    finally     { setBusy(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Complete&nbsp;Your&nbsp;Profile
        </h1>

        <form onSubmit={save} className="space-y-4">
          <label className="block text-gray-700 font-medium">
            Choose a unique username
          </label>

          <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden">
            <span className="px-3 text-gray-500 select-none">@</span>
            <input
              value={raw}
              onChange={e => setRaw(e.target.value)}
              placeholder="your_handle"
              className="flex-1 py-3 pr-3 text-lg placeholder-gray-600 focus:outline-none"
            />
          </div>

          {err && <p className="text-red-600 text-sm">{err}</p>}

          <button
            disabled={busy}
            className="w-full py-3 mt-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-700 transition"
          >
            {busy ? 'Saving…' : 'Save Username'}
          </button>

          <button
            type="button"
            onClick={() => router.replace('/login')}
            className="w-full py-3 rounded-lg bg-red-700 text-white font-semibold hover:bg-red-800 transition"
          >
            Cancel&nbsp;/&nbsp;Log&nbsp;Out
          </button>
        </form>
      </div>
    </div>
  );
}
