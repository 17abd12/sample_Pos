"use client";

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function FinancePage() {
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(type: "expense" | "investment") {
    try {
      setLoading(true);

      const endpoint = type === "expense" ? "/api/expenses" : "/api/investments";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, description }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || `${type} added!`);
        setAmount("");
        setDescription("");
        setShowExpenseModal(false);
        setShowInvestmentModal(false);
      } else {
        toast.error(data.message || "Something went wrong!");
      }
    } catch (err: any) {
      toast.error("Server error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
        <Toaster position="top-right" reverseOrder={false} />
      <h1 className="text-2xl font-bold mb-6">Finance Management</h1>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          className="px-4 py-2 bg-red-600 text-white rounded"
          onClick={() => setShowExpenseModal(true)}
        >
          Add Expense
        </button>

        <button
          className="px-4 py-2 bg-green-600 text-white rounded"
          onClick={() => setShowInvestmentModal(true)}
        >
          Add Investment
        </button>
      </div>

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-xl mb-4">Add Expense</h2>
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border w-full mb-2 p-2"
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border w-full mb-2 p-2"
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 bg-gray-300 rounded"
                onClick={() => setShowExpenseModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50"
                onClick={() => handleSubmit("expense")}
                disabled={loading}
              >
                {loading ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Investment Modal */}
      {showInvestmentModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-xl mb-4">Add Investment</h2>
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border w-full mb-2 p-2"
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border w-full mb-2 p-2"
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 bg-gray-300 rounded"
                onClick={() => setShowInvestmentModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50"
                onClick={() => handleSubmit("investment")}
                disabled={loading}
              >
                {loading ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
