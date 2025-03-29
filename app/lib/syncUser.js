export async function syncUserWithDatabase(user) {
  try {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebaseUid: user.uid, // Ensure this is defined!
        email: user.email,
        displayName: user.displayName || null,
        photoUrl: user.photoURL || null,
      }),
    });
    const data = await response.json();
    console.log("User synced:", data);
  } catch (err) {
    console.error("Failed to sync user with database:", err);
  }
}
