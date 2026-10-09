import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Eye, EyeOff } from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    try {
      setLoading(true);

      const response = await api.post("/auth/login", formData);

      login(response.data.user, response.data.token);

      navigate("/");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="hidden lg:flex flex-col justify-between p-12 xl:p-16"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
              <BookOpen size={20} />
            </div>

            <span className="text-xl font-semibold">BlogSphere</span>
          </div>

          <div className="max-w-lg">
            <p className="mb-5 text-sm font-medium uppercase tracking-[0.25em] text-neutral-500">
              Welcome back
            </p>

            <h1 className="text-5xl font-semibold leading-tight xl:text-6xl">
              Continue your journey through ideas.
            </h1>

            <p className="mt-6 max-w-md text-lg leading-8 text-neutral-400">
              Discover stories, share your thoughts, and connect with writers
              from around the world.
            </p>
          </div>

          <p className="text-sm text-neutral-600">Read. Write. Connect.</p>
        </motion.div>

        {/* Right */}
        <div className="flex items-center justify-center px-6 py-12 sm:px-10 lg:bg-white lg:text-neutral-950">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="w-full max-w-md"
          >
            {/* Mobile logo */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
                <BookOpen size={20} />
              </div>

              <span className="text-xl font-semibold">BlogSphere</span>
            </div>

            <div className="mb-8">
              <p className="mb-3 text-sm font-medium uppercase tracking-widest text-neutral-500">
                Welcome back
              </p>

              <h2 className="text-3xl font-semibold">Sign in to BlogSphere</h2>

              <p className="mt-3 text-sm text-neutral-500">
                Continue where you left off.
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3.5 outline-none transition focus:border-neutral-500 lg:border-neutral-300 lg:bg-white"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3.5 pr-12 outline-none transition focus:border-neutral-500 lg:border-neutral-300 lg:bg-white"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60 lg:bg-neutral-950 lg:text-white"
              >
                {loading ? "Signing in..." : "Sign in"}

                {!loading && <ArrowRight size={18} />}
              </motion.button>
            </form>

            <p className="mt-7 text-center text-sm text-neutral-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-white underline underline-offset-4 lg:text-black"
              >
                Create one
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Login;
