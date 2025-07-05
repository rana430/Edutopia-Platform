"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("http://localhost:5218/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        const token = response.headers.get("Token") || response.headers.get("token");
        if (token) {
            localStorage.setItem("token", token);
            console.log("Token stored:", token);
        }
        setTimeout(() => {
          router.push("/reset-password"); // Redirect after success
        }, 1500);
      } else {
        setErrorMessage(data.message || "Failed to send reset email.");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setErrorMessage("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="pb-12 text-center">
            <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
              Forgot Password?
            </h1>
          </div>

          {/* Forgot Password Form */}
          <form onSubmit={handleForgotPassword} className="mx-auto max-w-[400px]">
            <div>
              <label className="mb-1 block text-sm font-medium text-indigo-200/65" htmlFor="email">
                Enter your email
              </label>
              <input
                id="email"
                type="email"
                className="form-input w-full"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mt-6">
              <button
                type="submit"
                className="btn w-full bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]"
                disabled={loading}
              >
                Reset Password
              </button>
            </div>

            {errorMessage && <p className="mt-4 text-red-500">{errorMessage}</p>}
            {successMessage && <p className="mt-4 text-green-500">{successMessage}</p>}
          </form>
        </div>
      </div>
    </section>
  );
}
