import { motion } from "framer-motion";
import {
  CheckSquare,
  BrainCircuit,
  PawPrint,
  FileText,
  BarChart3,
  CalendarDays,
} from "lucide-react";

const features = [
  {
    icon: <CheckSquare size={34} />,
    title: "Smart Task Manager",
    description:
      "Create, organize and complete daily tasks with ease.",
  },
  {
    icon: <BrainCircuit size={34} />,
    title: "AI Scheduler",
    description:
      "Plan your day intelligently with AI-powered suggestions.",
  },
  {
    icon: <PawPrint size={34} />,
    title: "Panda Pet",
    description:
      "Complete tasks to earn XP, coins and grow your Panda.",
  },
  {
    icon: <FileText size={34} />,
    title: "PDF Manager",
    description:
      "Upload, organize and access important study materials.",
  },
  {
    icon: <BarChart3 size={34} />,
    title: "Internship Tracker",
    description:
      "Track reports, attendance and internship progress.",
  },
  {
    icon: <CalendarDays size={34} />,
    title: "Daily Planner",
    description:
      "Stay productive with smart reminders and planning.",
  },
];

function Features() {
  return (
    <section
      id="features"
      className="py-24 bg-gradient-to-b from-white to-slate-100 dark:from-slate-900 dark:to-slate-950 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-16">

          <p className="text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-widest">
            Features
          </p>

          <h2 className="text-5xl font-bold mt-3 text-slate-900 dark:text-slate-100">
            Everything You Need
          </h2>

          <p className="text-gray-500 dark:text-slate-400 mt-5 max-w-2xl mx-auto">
            One platform for managing your studies, internship,
            productivity and AI assistance.
          </p>

        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{
                y: -10,
                scale: 1.03,
              }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all border border-slate-100 dark:border-slate-800"
            >

              <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
                {feature.icon}
              </div>

              <h3 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">
                {feature.title}
              </h3>

              <p className="text-gray-600 dark:text-slate-400 leading-7">
                {feature.description}
              </p>

            </motion.div>
          ))}

        </div>

      </div>
    </section>
  );
}

export default Features;