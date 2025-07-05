"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

const API_URL = "http://localhost:5218/api";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string) => password.length >= 6;

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setErrors((prev) => ({
      ...prev,
      email: !newEmail ? "Email is required." : !validateEmail(newEmail) ? "Invalid email format." : "",
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setErrors((prev) => ({
      ...prev,
      password: !newPassword ? "Password is required." : !validatePassword(newPassword) ? "Password must be at least 6 characters long." : "",
    }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || errors.email || errors.password) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log(response.headers.getSetCookie());

      if (response.ok) {
        const token = response.headers.get("Token") || response.headers.get("token");
        if (token) {
          localStorage.setItem("token", token);
          console.log("Token stored:", token);
          router.push("/chatbot");
        } else {
          console.log("No token found in response headers");
        }
      } else {
        setErrorMessage(data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Sign in failed:", error);
      setErrorMessage("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          <motion.div 
            className="pb-12 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-semibold text-white md:text-4xl">Welcome to Edutopia</h1>
          </motion.div>

          <motion.form 
            className="mx-auto max-w-[400px]" 
            onSubmit={handleSignIn}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="space-y-5">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="mb-1 block text-sm font-medium text-indigo-200/65" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-input w-full border p-2 rounded-md bg-gray-800 text-white"
                  placeholder="Your email"
                  value={email}
                  onChange={handleEmailChange}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="mb-1 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-indigo-200/65" htmlFor="password">
                    Password
                  </label>
                  <Link className="text-sm text-gray-600 hover:underline" href="/forget-password">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="form-input w-full border p-2 rounded-md bg-gray-800 text-white pr-10"
                    placeholder="Your password"
                    value={password}
                    onChange={handlePasswordChange}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </motion.div>
            </div>

            {errorMessage && (
              <motion.p 
                className="text-red-500 text-sm mt-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {errorMessage}
              </motion.p>
            )}

            <div className="mt-6 space-y-5">
              <motion.button
                type="submit"
                className={`btn w-full bg-indigo-600 text-white rounded-md py-2 ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-700"}`}
                disabled={loading || !email || !password || !!errors.email || !!errors.password}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? "Signing in..." : "Sign in"}
              </motion.button>

              <div className="flex items-center gap-3 text-center text-sm italic text-gray-600 before:h-px before:flex-1 before:bg-gray-400/25 after:h-px after:flex-1 after:bg-gray-400/25">
                or
              </div>
            </div>
          </motion.form>

          <motion.div 
            className="mt-6 text-center text-sm text-indigo-200/65"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Don't have an account?{" "}
            <Link className="font-medium text-indigo-500 hover:text-indigo-400 transition-colors" href="/signup">
              Sign Up
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}