'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ImageUpload from '@/components/settings/ImageUpload';

const RE_USERNAME = /^[a-zA-Z0-9_]{3,20}$/;          // 3-20 chars, letters / numbers / _

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [raw, setRaw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // Check if user has an existing invalid username (likely from OAuth full name)
  const hasInvalidUsername = session?.user?.displayName &&
                              !/^[a-zA-Z0-9_]{3,20}$/.test(session.user.displayName);

  /* pre-fill current username once session is ready */
  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.push('/login');
    } else {
      // Only pre-fill if they have a valid displayName (not their full name)
      setRaw(session.user.displayName ?? '');
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

  /* handle profile picture update */
  const handleImageUpload = async (imageUrl) => {
    try {
      setBusy(true);
      if (typeof update === 'function') {
        await update({ image: imageUrl });
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to update profile picture:', error);
      setErr('Failed to update profile picture. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  /* loading splash */
  if (status === 'loading' || !session?.user) {
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

          {hasInvalidUsername && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Your current username contains invalid characters. Please choose a new username with only letters, numbers, and underscores.
              </p>
            </div>
          )}

          {!session?.user?.displayName && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Username Required:</strong> You must create a username to access the site. Choose 3-20 characters (letters, numbers, or underscore only).
              </p>
            </div>
          )}

          {/* Profile Picture Upload */}
          <div className="mb-8">
            <ImageUpload
              currentImage={session?.user?.image}
              onUpload={handleImageUpload}
              disabled={busy}
            />
          </div>

          <label className="block text-gray-700 font-semibold mb-2">
            Display&nbsp;Name&nbsp;/&nbsp;Username
          </label>

          <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden mb-4">
            <span className="px-3 text-gray-500 select-none">@</span>
            <input
              type="text"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="your_handle"
              className="flex-1 py-3 pr-3 text-gray-900 placeholder-gray-600 focus:outline-none"
              maxLength={30}
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

          {/* DEBUG: Temporary testing button */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-yellow-900 mb-2">🧪 Testing Tools</h3>
              <p className="text-xs text-yellow-700 mb-3">Temporary button for testing username flow</p>
              <button
                onClick={async () => {
                  if (confirm('Clear your username? This is for testing only.')) {
                    setBusy(true);
                    try {
                      const res = await fetch('/api/debug/clear-username', { method: 'POST' });
                      if (res.ok) {
                        alert('Username cleared! Refreshing page...');
                        window.location.reload();
                      } else {
                        alert('Failed to clear username');
                      }
                    } catch (e) {
                      alert('Error: ' + e.message);
                    } finally {
                      setBusy(false);
                    }
                  }
                }}
                disabled={busy}
                className="px-4 py-2 rounded-md bg-yellow-600 text-white text-sm font-medium hover:bg-yellow-700 transition disabled:opacity-50"
              >
                Clear Username (Test Only)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
