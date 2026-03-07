"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import toast, { Toaster } from "react-hot-toast"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Login failed")
        setLoading(false)
        return
      }

      toast.success("✅ Login successful!")

      const meRes = await fetch("/api/me");

      // const text = await meRes.text();
      // console.log(" Raw /api/me response:", text);

      const me = await meRes.json();
      console.log("Here")

      setLoading(false)
      window.location.href = "/"
      // router.push("/")
      // router.refresh() // ensures new data is fetched
    }
    catch (err) {
      if (err instanceof Error) {
        console.error("💥 Login error:", err.message);
        toast.error(`Error occurred: ${err.message}`);
      } else {
        console.error("💥 Login error (unknown):", err);
        toast.error("An unknown error occurred!");
      }
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <Toaster position="top-center" reverseOrder={false} />
      <form
        onSubmit={handleSubmit}
        className="p-6 bg-white rounded shadow-md w-96 space-y-4"
      >
        <h1 className="text-xl font-bold">Login</h1>
        {error && <p className="text-red-500">{error}</p>}
        <input
          className="w-full p-2 border rounded"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          className="w-full p-2 border rounded"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full text-white p-2 rounded ${loading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
            }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  )
}