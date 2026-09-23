import { motion } from "framer-motion";

const stats = [
  { value: "500+", label: "Students" },
  { value: "1200+", label: "Tasks Completed" },
  { value: "50+", label: "Internships Managed" },
  { value: "99%", label: "Productivity" },
];

function Stats() {
  return (
    <section
      id="about"
      className="scroll-mt-24 py-12 sm:py-20 bg-white dark:bg-slate-900 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-8">

          {stats.map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-4 sm:p-8 text-center shadow-lg sm:shadow-xl"
            >
              <h2 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2">
                {stat.value}
              </h2>

              <p className="text-xs sm:text-base text-indigo-100 font-medium">
                {stat.label}
              </p>

            </motion.div>
          ))}

        </div>

      </div>
    </section>
  );
}

export default Stats;