"use client";
import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // 1. Sign out from Firebase
      await signOut(auth);

      // 2. Clear the session cookie (matches your middleware)
      document.cookie =
        "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      // 3. Optional: Call logout API for server-side cleanup
      await fetch("/api/auth/logout", { method: "POST" });

      // 4. Redirect to login
      router.push("/login");
      console.log("Logout successful");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h2 className="text-lg font-semibold text-blue-900">
              🎉 Protected Route Working!
            </h2>
            <p className="text-blue-700">
              If you can see this page, your middleware is protecting it
              correctly.
            </p>
            <p className="text-blue-700 mt-2">
              Click "Logout" to test if the middleware redirects you to login.
            </p>
          </div>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-lg font-semibold text-green-900">
              Test Steps:
            </h3>
            <ol className="list-decimal list-inside text-green-700 mt-2 space-y-1">
              <li>You should see this dashboard (middleware allowed access)</li>
              <li>Click "Logout" to clear your session</li>
              <li>
                Try to visit{" "}
                <code className="bg-green-100 px-1 rounded">/dashboard</code>{" "}
                again
              </li>
              <li>
                You should be redirected to{" "}
                <code className="bg-green-100 px-1 rounded">/login</code>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
