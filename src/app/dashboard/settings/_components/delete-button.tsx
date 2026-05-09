"use client";
import { deleteAccount } from "../actions";

export function DeleteAccountButton() {
  return (
    <form
      action={deleteAccount}
      onSubmit={(e) => {
        if (!confirm("This will permanently delete your account, all agents, and all run data. This cannot be undone. Are you sure?")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        style={{
          padding: "8px 18px", borderRadius: 9, border: "none", cursor: "pointer",
          fontSize: 13, fontWeight: 700, background: "#ef4444", color: "#fff",
          boxShadow: "0 0 12px rgba(239,68,68,0.3)", flexShrink: 0,
        }}
      >
        Delete Account
      </button>
    </form>
  );
}
