"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

const API_URL = "http://localhost:5218/api";

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string) => password.length >= 6;
  const validateName = (name: string) => name.length >= 2;

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));

    // Validation
    switch (id) {
      case 'email':
        setErrors(prev => ({
          ...prev,
          email: !value ? "Email is required." : !validateEmail(value) ? "Invalid email format." : ""
        }));
        break;
      case 'password':
        setErrors(prev => ({
          ...prev,
          password: !value ? "Password is required." : !validatePassword(value) ? "Password must be at least 6 characters." : ""
        }));
        break;
      case 'name':
        setErrors(prev => ({
          ...prev,
          name: !value ? "Name is required." : !validateName(value) ? "Name must be at least 2 characters." : ""
        }));
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (errors.email || errors.password || errors.name) return;
    
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.message || "Registration failed");
      } else {
        router.push("/signin");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
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
            <h1 className="text-3xl font-semibold text-white md:text-4xl">
              Create an Edutopia Account
            </h1>
          </motion.div>
          
          {error && (
            <motion.div 
              className="mx-auto mb-6 max-w-[400px] rounded bg-red-100 p-3 text-sm text-red-600"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}
          
          <motion.form 
            className="mx-auto max-w-[400px]" 
            onSubmit={handleSubmit}
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
                <label className="mb-1 block text-sm font-medium text-indigo-200/65" htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  className="form-input w-full border p-2 rounded-md bg-gray-800 text-white"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </motion.div>
             
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="mb-1 block text-sm font-medium text-indigo-200/65" htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-input w-full border p-2 rounded-md bg-gray-800 text-white"
                  placeholder="Your email"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-medium text-indigo-200/65" htmlFor="password">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="form-input w-full border p-2 rounded-md bg-gray-800 text-white pr-10"
                    placeholder="Password (at least 6 characters)"
                    value={formData.password}
                    onChange={handleChange}
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

            <div className="mt-6 flex items-center gap-3 text-center text-sm italic text-gray-600 before:h-px before:flex-1 before:bg-gray-400/25 after:h-px after:flex-1 after:bg-gray-400/25">
              or
            </div>

            <div className="mt-6 space-y-5">
              <motion.button
                type="submit"
                className={`btn w-full bg-indigo-600 text-white rounded-md py-2 ${isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-700"}`}
                disabled={isSubmitting || Object.values(errors).some(error => error !== "")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? "Registering..." : "Register"}
              </motion.button>
            </div>
          </motion.form>

          <motion.div 
            className="mt-6 text-center text-sm text-indigo-200/65"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Already have an account?{" "}
            <Link className="font-medium text-indigo-500 hover:text-indigo-400 transition-colors" href="/signin">
              Sign in
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}