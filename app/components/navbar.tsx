"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"


type JwtPayload = {
  username: string
  name: string
  role: string
  exp?: number
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [exportingOrders, setExportingOrders] = useState(false)
  const [exportingInventory, setExportingInventory] = useState(false)
  const [exportingLedger, setExportingLedger] = useState(false)
  const [exportingExpenses, setExportingExpenses] = useState(false)
  const [role, setRole] = useState<string | null>(null)

  const router = useRouter()
  const pathname = usePathname()

  // Decode role from JWT cookie
  const [loadingRole, setLoadingRole] = useState(true)

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await fetch("/api/me")
        const data = await res.json()
        setRole(data.role)
      } finally {
        setLoadingRole(false)
      }
    }
    fetchRole()
  }, [])

  const onLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch("/api/logout", { method: "POST" })
      document.cookie = "token=; Max-Age=0; path=/;"
      router.push("/login")
    } finally {
      setLoggingOut(false)
    }
  }

  const isLoginPage = pathname === "/login"

  // Export CSV helpers (with loading state)
  const exportFile = async (type: "orders" | "inventory" | "ledger" | "expenses") => {
    if (type === "orders") setExportingOrders(true)
    if (type === "inventory") setExportingInventory(true)
    if (type === "ledger") setExportingLedger(true)
    if (type === "expenses") setExportingExpenses(true)

    try {
      const url =
        type === "ledger"
          ? "/api/export/ledger"
          : `/api/export?type=${type}`

      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to export")

      const blob = await res.blob()
      const downloadUrl = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `${type}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000)
    } catch (err) {
      console.error(err)
      alert("Export failed, please try again.")
    } finally {
      if (type === "orders") setExportingOrders(false)
      if (type === "inventory") setExportingInventory(false)
      if (type === "ledger") setExportingLedger(false)
      if (type === "expenses") setExportingExpenses(false)
    }
  }

  return (
    <nav className="bg-slate-800 px-6 py-3 text-white">
      <div className="flex items-center justify-between">
        {/* Brand */}
        <Link href="/">
          <div className="text-lg font-bold">POS Service</div>
        </Link>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden block text-white focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>

        {/* Desktop Menu */}
        <ul className="hidden md:flex gap-6 items-center">
          {isLoginPage ? (
            <li className="font-semibold">Please login</li>
          ) : (
            <>
              <li>
                <Link href="/sales" className="hover:text-gray-300">
                   Sales
                </Link>
              </li>
              <li>
                <Link href="/inventory/view" className="hover:text-gray-300">
                  Inventory
                </Link>
              </li>
              {role === "manager" && (
                <li>
                  <Link href="/inventory/add" className="hover:text-gray-300">
                    Add Inventory
                  </Link>
                </li>
              )}

              {/* Finance only for managers */}
              {role === "manager" && (
                <li>
                  <Link href="/finance" className="hover:text-gray-300">
                    Finance
                  </Link>
                </li>
              )}

              {/* Export buttons only for managers */}
              {role === "manager" && (
                <>
                  <li>
                    <button
                      onClick={() => exportFile("orders")}
                      disabled={exportingOrders}
                      className={`px-3 py-2 rounded-lg font-medium ${exportingOrders
                          ? "bg-gray-500 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                      {exportingOrders ? "Exporting..." : "Export Orders"}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => exportFile("inventory")}
                      disabled={exportingInventory}
                      className={`px-3 py-2 rounded-lg font-medium ${exportingInventory
                          ? "bg-gray-500 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700"
                        }`}
                    >
                      {exportingInventory
                        ? "Exporting..."
                        : "Export Inventory"}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => exportFile("ledger")}
                      disabled={exportingLedger}
                      className={`px-3 py-2 rounded-lg font-medium ${exportingLedger
                          ? "bg-gray-500 cursor-not-allowed"
                          : "bg-purple-600 hover:bg-purple-700"
                        }`}
                    >
                      {exportingLedger ? "Exporting..." : "Export Revenue"}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => exportFile("expenses")}
                      disabled={exportingExpenses}
                      className={`px-3 py-2 rounded-lg font-medium ${exportingExpenses
                          ? "bg-gray-500 cursor-not-allowed"
                          : "bg-amber-600 hover:bg-amber-700"
                        }`}
                    >
                      {exportingExpenses ? "Exporting..." : "Export Expense Sheet"}
                    </button>
                  </li>
                </>
              )}

              <li>
                <button
                  onClick={onLogout}
                  disabled={loggingOut}
                  className={`px-4 py-2 rounded-lg font-medium ${loggingOut
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                    }`}
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </li>
            </>
          )}
        </ul>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <ul className="md:hidden flex flex-col gap-4 mt-3 bg-slate-700 p-4 rounded-lg">
          {isLoginPage ? (
            <li className="font-semibold">Please login</li>
          ) : (
            <>
              <li>
                <Link href="/sales" className="hover:text-gray-300">
                  Sales
                </Link>
              </li>
              {role === "manager" && (
                <li>
                  <Link href="/inventory/add" className="hover:text-gray-300">
                    Add Inventory
                  </Link>
                </li>
              )}
              <li>
                <Link href="/inventory/view" className="hover:text-gray-300">
                  Inventory
                </Link>
              </li>

              {/* Finance only for managers */}
              {role === "manager" && (
                <li>
                  <Link href="/finance" className="hover:text-gray-300">
                    Finance
                  </Link>
                </li>
              )}

              {/* Export buttons only for managers */}
              {role === "manager" && (
                <>
                  <li>
                    <button
                      onClick={() => exportFile("orders")}
                      disabled={exportingOrders}
                      className={`px-3 py-2 rounded-lg font-medium w-full ${exportingOrders
                          ? "bg-gray-500 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                      {exportingOrders ? "Exporting..." : "Export Orders"}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => exportFile("inventory")}
                      disabled={exportingInventory}
                      className={`px-3 py-2 rounded-lg font-medium w-full ${exportingInventory
                          ? "bg-gray-500 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700"
                        }`}
                    >
                      {exportingInventory
                        ? "Exporting..."
                        : "Export Inventory"}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => exportFile("ledger")}
                      disabled={exportingLedger}
                      className={`px-3 py-2 rounded-lg font-medium w-full ${exportingLedger
                          ? "bg-gray-500 cursor-not-allowed"
                          : "bg-purple-600 hover:bg-purple-700"
                        }`}
                    >
                      {exportingLedger ? "Exporting..." : "Export Revenue"}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => exportFile("expenses")}
                      disabled={exportingExpenses}
                      className={`px-3 py-2 rounded-lg font-medium w-full ${exportingExpenses
                          ? "bg-gray-500 cursor-not-allowed"
                          : "bg-amber-600 hover:bg-amber-700"
                        }`}
                    >
                      {exportingExpenses ? "Exporting..." : "Export Expenses"}
                    </button>
                  </li>
                </>
              )}

              <li>
                <button
                  onClick={onLogout}
                  disabled={loggingOut}
                  className={`px-4 py-2 rounded-lg font-medium w-full ${loggingOut
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                    }`}
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </li>
            </>
          )}
        </ul>
      )}
    </nav>
  )
}
