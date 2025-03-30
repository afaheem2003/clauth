export async function syncUserWithDatabase(user) {
  try {
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Use 'id' from NextAuth
        id: user.uid,
        email: user.email,
        displayName: user.displayName || null,
        photoUrl: user.photoURL || null,
      }),
    });
  } catch (err) {
    console.error("Failed to sync user with database:", err);
  }
}
