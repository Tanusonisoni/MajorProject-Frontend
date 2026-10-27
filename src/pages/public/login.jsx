
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { loginApi } from "../../services.jsx/adminApi.js";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

 
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const result = await loginApi({ email, password });

    if (!result) return;

    const token = result.accessToken;

    if (!token) {
      toast.error("The server did not return an access token.");
      return;
    }

    localStorage.setItem("token", token);
    localStorage.setItem("role", result.role);
    localStorage.setItem("userName", result.name || "");
    localStorage.setItem("userId", result._id || "");

    if (result.role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    } else if (result.role === "student") {
      navigate("/student/dashboard", { replace: true });
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      toast.error("This account does not have a supported EcoQuest role.");
    }
  } finally {
    setLoading(false);
  }
};


  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#E8F3EE] via-[#F7F7FB] to-[#E9E4F5] px-4 py-5">
      <div className="w-full max-w-sm rounded-2xl border border-white bg-white p-6 shadow-xl shadow-[#29283A]/10 sm:p-7">
        <Link to="/" className="block text-center text-2xl font-extrabold tracking-tight text-[#176B50]">
          Eco<span>Quest</span>
        </Link>

        <h2 className="mt-3 text-center text-xl font-bold text-[#26352D]">
          Sign in
        </h2>
        <p className="mb-6 mt-1 text-center text-sm text-[#26352D]">
          Small steps. Big impact.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#26352D]">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-[#E0E5E2] bg-[#FAFBFA] px-3.5 py-2.5 text-sm text-[#26352D] outline-none transition placeholder:text-[#969DA0] focus:border-[#7864A8] focus:bg-white focus:ring-2 focus:ring-[#7864A8]/15"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#26352D]">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-[#E0E5E2] bg-[#FAFBFA] px-3.5 py-2.5 pr-14 text-sm text-[#26352D] outline-none transition placeholder:text-[#969DA0] focus:border-[#7864A8] focus:bg-white focus:ring-2 focus:ring-[#7864A8]/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#176B50] hover:text-[#59458B]"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#176B50] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#66528F] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#626B65]">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-[#176B50] hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}

export default Login;
