"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";


const CORRECT_PASSWORD = "shukus2026"; // 仮パスワード

export default function PasswordLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      router.push("/main");
    } else {
      setError("パスワードが違います");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 p-8 bg-white rounded shadow-md w-full max-w-xs mx-auto mt-24">
      <h2 className="text-xl font-bold">パスワードでログイン</h2>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="パスワードを入力"
        className="border rounded px-3 py-2 w-full"
      />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">ログイン</button>
    </form>
  );
}
