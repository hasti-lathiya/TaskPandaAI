import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function Hero() {
  return (
    <section
      id="home"
      className="scroll-mt-24 min-h-[90vh] bg-gradient-to-br from-sky-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/80 flex items-center transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16 lg:py-0 grid lg:grid-cols-2 gap-10 items-center">

        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-indigo-600 dark:text-indigo-400 font-semibold mb-3">
            🚀 AI Powered Student Productivity
          </p>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-slate-900 dark:text-slate-100">
            Manage Tasks.
            <br />
            Track Internship.
            <br />
            Grow Your Panda.
          </h1>

          <p className="text-gray-600 dark:text-slate-300 text-lg mb-8">
            TaskPanda AI helps students manage tasks, internships,
            productivity and AI assistance in one beautiful platform.
          </p>

          <div className="flex flex-wrap gap-4">

            <Link
              to="/register"
              className="bg-indigo-600 dark:bg-indigo-500 text-white px-8 py-4 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition cursor-pointer font-medium"
            >
              Get Started
            </Link>

            <a
              href="#features"
              className="border border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 px-8 py-4 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition cursor-pointer font-medium"
            >
              Learn More
            </a>

          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex justify-center"
        >
          <div className="w-64 sm:w-80 lg:w-96 aspect-square max-w-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-2xl">

            <span className="text-7xl sm:text-8xl lg:text-9xl">
              🐼
            </span>

          </div>
        </motion.div>

      </div>
    </section>
  );
}

export default Hero;