import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";

import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../../firebase/firebase";
import { doc, setDoc } from "firebase/firestore";


function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (formData.password !== formData.confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  try {
    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

    await updateProfile(userCredential.user, {
      displayName: formData.fullName,
    });

    // Create user document in Firestore with default values
    await setDoc(doc(db, "users", userCredential.user.uid), {
      fullName: formData.fullName,
      email: formData.email.toLowerCase(),
      role: "Computer Science Student",
      major: "Software Engineering",
      bio: "Active productivity companion grower and student.",
      xp: 1240,
      level: 1,
      coins: 1250,
      streak: 7,
      equippedCompanion: "Panda",
      ownedCompanions: ["Panda"],
      lastCompletedDate: "",
      createdAt: new Date().toISOString(),
    });

    alert("🎉 Account Created Successfully!");

    navigate("/login");
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
            Create Account
          </h2>

          <p className="text-gray-500 dark:text-slate-400 mt-2">
            Join TaskPanda AI today
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Full Name */}

          <div>
            <label className="block mb-2 font-medium text-slate-700 dark:text-slate-200">
              Full Name
            </label>

            <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-xl px-4 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-500">

              <User className="text-gray-400 dark:text-slate-400" size={20} />

              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full p-3 outline-none text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 bg-transparent"
              />

            </div>
          </div>

          {/* Email */}

          <div>
            <label className="block mb-2 font-medium text-slate-700 dark:text-slate-200">
              Email
            </label>

            <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-xl px-4 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-500">

              <Mail className="text-gray-400 dark:text-slate-400" size={20} />

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full p-3 outline-none text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 bg-transparent"
              />

            </div>
          </div>

          {/* Password */}

          <div>
            <label className="block mb-2 font-medium text-slate-700 dark:text-slate-200">
              Password
            </label>

            <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-xl px-4 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-500">

              <Lock className="text-gray-400 dark:text-slate-400" size={20} />

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
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

          {/* Confirm Password */}

          <div>
            <label className="block mb-2 font-medium text-slate-700 dark:text-slate-200">
              Confirm Password
            </label>

            <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-xl px-4 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-500">

              <Lock className="text-gray-400 dark:text-slate-400" size={20} />

              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                className="w-full p-3 outline-none text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 bg-transparent"
              />

            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-3 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition cursor-pointer font-medium"
          >
            Create Account
          </button>

        </form>

        <p className="text-center mt-6 text-gray-500 dark:text-slate-400">

          Already have an account?

          <Link
            to="/login"
            className="text-indigo-600 dark:text-indigo-400 font-semibold ml-2"
          >
            Login
          </Link>

        </p>

      </div>

    </div>
  );
}

export default Register;