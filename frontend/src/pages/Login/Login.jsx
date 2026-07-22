import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/firebase";

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      alert("🎉 Login Successful!");

      navigate("/dashboard");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-6 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-2xl rounded-3xl w-full max-w-md p-8 transition-colors duration-300">

        <div className="text-center mb-8">
          <h1 className="text-5xl mb-2">🐼</h1>

          <h2 className="text-3xl font-bold text-gray-800 dark:text-slate-100">
            Welcome Back
          </h2>

          <p className="text-gray-500 dark:text-slate-400 mt-2">
            Login to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block mb-2 font-medium text-slate-700 dark:text-slate-200">
              Email
            </label>

            <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-xl px-4 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-500">

              <Mail className="text-gray-400 dark:text-slate-400" size={20} />

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 outline-none text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 bg-transparent"
              />

            </div>
          </div>

          <div>

            <label className="block mb-2 font-medium text-slate-700 dark:text-slate-200">
              Password
            </label>

            <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-xl px-4 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-500">

              <Lock className="text-gray-400 dark:text-slate-400" size={20} />

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 outline-none text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 bg-transparent"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>

            </div>

          </div>

          <div className="text-right">

            <Link
              to="/forgot-password"
              className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline"
            >
              Forgot Password?
            </Link>

          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-3 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition cursor-pointer font-medium"
          >
            Login
          </button>

        </form>

        <p className="text-center mt-6 text-gray-500 dark:text-slate-400">

          Don't have an account?

          <Link
            to="/register"
            className="text-indigo-600 dark:text-indigo-400 font-semibold ml-2"
          >
            Register
          </Link>

        </p>

      </div>
    </div>
  );
}

export default Login;