"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });

  const router = useRouter();

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  // Live validation when typing
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setErrors((prev) => ({
      ...prev,
      email: !newEmail
        ? "Email is required."
        : !validateEmail(newEmail)
        ? "Invalid email format."
        : "",
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setErrors((prev) => ({
      ...prev,
      password: !newPassword
        ? "Password is required."
        : !validatePassword(newPassword)
        ? "Password must be at least 6 characters long."
        : "",
    }));
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();

    if (!errors.email && !errors.password && email && password) {
      console.log("Form submitted successfully");
      router.push("/upload");
    }
  };

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="pb-12 text-center">
            <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
              Welcome to Edutopia
            </h1>
          </div>

          {/* Contact form */}
          <form className="mx-auto max-w-[400px]" onSubmit={handleSignIn}>
            <div className="space-y-5">
              {/* Email Input */}
              <div>
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
              </div>

              {/* Password Input */}
              <div>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-indigo-200/65" htmlFor="password">
                    Password
                  </label>
                  <Link className="text-sm text-gray-600 hover:underline" href="/reset-password">
                    Forgot?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  className="form-input w-full border p-2 rounded-md bg-gray-800 text-white"
                  placeholder="Your password"
                  value={password}
                  onChange={handlePasswordChange}
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>
            </div>

            {/* Sign In Button */}
            <div className="mt-6 space-y-5">
              <button
                type="submit"
                className={`btn w-full bg-indigo-600 text-white rounded-md py-2 ${
                  email && password && !errors.email && !errors.password
                    ? "hover:bg-indigo-700"
                    : "opacity-50 cursor-not-allowed"
                }`}
                disabled={!email || !password || !!errors.email || !!errors.password}
              >
                Sign in
              </button>

              <div className="flex items-center gap-3 text-center text-sm italic text-gray-600 before:h-px before:flex-1 before:bg-gray-400/25 after:h-px after:flex-1 after:bg-gray-400/25">
                or
              </div>
            </div>
          </form>

          {/* Bottom link */}
          <div className="mt-6 text-center text-sm text-indigo-200/65">
            Don't have an account?{" "}
            <Link className="font-medium text-indigo-500" href="/signup">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
