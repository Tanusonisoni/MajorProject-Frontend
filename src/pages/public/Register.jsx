
import { useState } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { registerApi } from "../../services.jsx/adminApi.js";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError("");
    };

    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const { name, email, password, confirmPassword } = formData;

       if (!name.trim() || !email.trim() || !password || !confirmPassword) {
  toast.error("Please fill in all fields.");
  return;
}

if (password.length < 8) {
  toast.error("Password must be at least 8 characters.");
  return;
}

if (password !== confirmPassword) {
  toast.error("Passwords do not match.");
  return;
}

        try {
            setLoading(true);

            const result = await registerApi({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password,
            });

            if (!result) {
                return;
            }

            navigate("/login");
        } catch (err) {
  setError(
    err.response?.data?.message ||
    "Registration failed. Please try again."
  );
        } finally {
            setLoading(false);
        }

    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#E8F3EE] via-[#F7F7FB] to-[#E9E4F5] px-4 py-5">
            <div className="w-full max-w-sm rounded-2xl border border-white bg-white p-6 shadow-xl shadow-[#29283A]/10 sm:p-7">
                <Link
                    to="/"
                    className="block text-center text-2xl font-extrabold tracking-tight text-[#176B50]"
                >
                    Eco<span>Quest</span>
                </Link>

                <h2 className="mt-3 text-center text-xl font-bold text-[#26352D]">
                    Create account
                </h2>

                <p className="mb-5 mt-1 text-center text-sm text-[#26352D]">
                    Small steps. Big impact.
                </p>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div>
                        <label
                            htmlFor="name"
                            className="mb-1.5 block text-sm font-medium text-[#26352D]"
                        >
                            Full name
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            required
                            className="w-full rounded-lg border border-[#E0E5E2] bg-[#FAFBFA] px-3.5 py-2.5 text-sm text-[#26352D] outline-none transition placeholder:text-[#969DA0] focus:border-[#7864A8] focus:bg-white focus:ring-2 focus:ring-[#7864A8]/15"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="email"
                            className="mb-1.5 block text-sm font-medium text-[#26352D]"
                        >
                            Email address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            required
                            className="w-full rounded-lg border border-[#E0E5E2] bg-[#FAFBFA] px-3.5 py-2.5 text-sm text-[#26352D] outline-none transition placeholder:text-[#969DA0] focus:border-[#7864A8] focus:bg-white focus:ring-2 focus:ring-[#7864A8]/15"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="mb-1.5 block text-sm font-medium text-[#26352D]"
                        >
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create a password"
                                required
                                className="w-full rounded-lg border border-[#E0E5E2] bg-[#FAFBFA] px-3.5 py-2.5 pr-14 text-sm text-[#26352D] outline-none transition placeholder:text-[#969DA0] focus:border-[#7864A8] focus:bg-white focus:ring-2 focus:ring-[#7864A8]/15"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Password must be at least 5 characters.
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#176B50] hover:text-[#59458B]"
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="mb-1.5 block text-sm font-medium text-[#26352D]"
                        >
                            Confirm password
                        </label>
                        <div className="relative">
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                autoComplete="new-password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm your password"
                                required
                                className="w-full rounded-lg border border-[#E0E5E2] bg-[#FAFBFA] px-3.5 py-2.5 pr-14 text-sm text-[#26352D] outline-none transition placeholder:text-[#969DA0] focus:border-[#7864A8] focus:bg-white focus:ring-2 focus:ring-[#7864A8]/15"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#176B50] hover:text-[#59458B]"
                            >
                                {showConfirmPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-[#176B50] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#66528F] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Creating account..." : "Create Account"}
                    </button>
                </form>

                <p className="mt-5 text-center text-sm text-[#626B65]">
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        className="font-semibold text-[#176B50] hover:underline"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </main>
    );
}

export default Register;
