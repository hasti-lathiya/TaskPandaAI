import { useState } from "react";
import jsPDF from "jspdf";
import MainLayout from "../../layouts/MainLayout";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function PDFManager() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [documentType, setDocumentType] = useState("");
  const [analysisResult, setAnalysisResult] = useState([]);

  const handlePDFUpload = async (file) => {
    if (!file) return;

    setSelectedFile(file);

    try {
      const fileReader = new FileReader();

      fileReader.onload = async function () {
        const typedArray = new Uint8Array(
          this.result
        );

        const pdf =
          await pdfjsLib.getDocument({
            data: typedArray,
          }).promise;

        setPageCount(pdf.numPages);
      };

      fileReader.readAsArrayBuffer(file);

    } catch (error) {
      console.log(error);
    }
  };

  const analyzeDocument = async () => {
  if (!selectedFile) {
    alert("Please upload a PDF first.");
    return;
  }

  const fileReader = new FileReader();

  fileReader.onload = async function () {
    const typedArray = new Uint8Array(
      this.result
    );

    const pdf = await pdfjsLib.getDocument({
      data: typedArray,
    }).promise;

    let extractedText = "";

    for (
      let i = 1;
      i <= pdf.numPages;
      i++
    ) {
      const page =
        await pdf.getPage(i);

      const textContent =
        await page.getTextContent();

      const pageText =
        textContent.items
          .map(
            (item) => item.str
          )
          .join(" ");

      extractedText +=
        pageText.toLowerCase();
    }

    const results = [];
  // Panda AI Auto Detection

let detectedType = "";

if (
  extractedText.includes("education") &&
  extractedText.includes("skill") &&
  extractedText.includes("project")
) {
  detectedType = "Resume";
}

else if (
  extractedText.includes("introduction") &&
  extractedText.includes("reference")
) {
  detectedType = "Assignment";
}

if (
  (
    extractedText.includes("company") ||
    extractedText.includes("organization") ||
    extractedText.includes("internship")
  ) &&
  extractedText.includes("work done")
) {
  detectedType = "Internship Report";
}

else if (
  extractedText.includes("problem statement") &&
  extractedText.includes("methodology")
) {
  detectedType = "Project Report";
}

if (detectedType === "") {
  detectedType = "Unknown Document";
}
setDocumentType(detectedType);


    if (detectedType === "Resume") {

  results.push({
    title: "Education",
    found: extractedText.includes("education"),
  });

  results.push({
    title: "Skills",
    found: extractedText.includes("skill"),
  });

  results.push({
    title: "Projects",
    found: extractedText.includes("project"),
  });

  results.push({
    title: "Experience",
    found: extractedText.includes("experience"),
  });

  results.push({
    title: "Certifications",
    found: extractedText.includes("certification"),
  });

}

if (detectedType === "Assignment") {

  results.push({
    title: "Introduction",
    found: extractedText.includes("introduction"),
  });

  results.push({
    title: "Objectives",
    found: extractedText.includes("objective"),
  });

  results.push({
    title: "Conclusion",
    found: extractedText.includes("conclusion"),
  });

  results.push({
    title: "References",
    found: extractedText.includes("reference"),
  });

}

if (detectedType === "Internship Report") {

  results.push({
    title: "Company Introduction",
    found: extractedText.includes("company"),
  });

  results.push({
    title: "Work Done",
    found: extractedText.includes("work"),
  });

  results.push({
    title: "Technologies Used",
    found:
      extractedText.includes("technology") ||
      extractedText.includes("tools"),
  });

  results.push({
    title: "Learning Outcomes",
    found: extractedText.includes("learning"),
  });

  results.push({
    title: "Conclusion",
    found: extractedText.includes("conclusion"),
  });

}

if (detectedType === "Project Report") {

  results.push({
    title: "Problem Statement",
    found:
      extractedText.includes("problem statement"),
  });

  results.push({
    title: "Objectives",
    found: extractedText.includes("objective"),
  });

  results.push({
    title: "Methodology",
    found:
      extractedText.includes("methodology"),
  });

  results.push({
    title: "Implementation",
    found:
      extractedText.includes("implementation"),
  });

  results.push({
    title: "Testing",
    found: extractedText.includes("testing"),
  });

  results.push({
    title: "Future Scope",
    found:
      extractedText.includes("future scope"),
  });

}

    setAnalysisResult(results);
  };

  fileReader.readAsArrayBuffer(
    selectedFile
  );
};
  const downloadReport = () => {
  const pdf = new jsPDF();

  const score = Math.round(
    (
      analysisResult.filter(
        (item) => item.found
      ).length /
      analysisResult.length
    ) * 100
  );

  pdf.setFontSize(20);
  pdf.text(
    "TaskPanda AI Analysis Report",
    20,
    20
  );

  pdf.setFontSize(12);

  pdf.text(
    `Document Type: ${documentType}`,
    20,
    40
  );

  pdf.text(
    `Readiness Score: ${score}%`,
    20,
    50
  );

  pdf.text(
    `Status: ${
      score >= 80
        ? "Ready for Submission"
        : score >= 50
        ? "Needs Improvements"
        : "Not Ready Yet"
    }`,
    20,
    60
  );

  let y = 80;

  pdf.text(
    "Analysis Results:",
    20,
    y
  );

  y += 10;

  analysisResult.forEach((item) => {
    pdf.text(
      `${item.found ? "FOUND" : "MISSING"} - ${item.title}`,
      20,
      y
    );

    y += 10;
  });

  pdf.save(
    "TaskPanda_Report.pdf"
  );
};

  return (
    <MainLayout>

      {/* Header */}

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">
          📄 PDF Intelligence Manager
        </h1>

        <p className="text-gray-500 dark:text-slate-400 mt-2">
          Upload, analyze and improve academic documents using AI.
        </p>
      </div>

      {/* Hero */}

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg p-8 mb-8 border border-gray-200 dark:border-slate-800 transition-colors duration-300">

        <div className="flex justify-between items-center">

          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              🤖 AI Document Assistant
            </h2>

            <p className="text-gray-500 dark:text-slate-400 mt-3">
              Analyze resumes, assignments, reports and internship documents automatically.
            </p>
          </div>

          <div className="text-7xl">
            📚
          </div>

        </div>

      </div>

      {/* Upload Section */}

      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-lg p-8 mb-8 transition-colors duration-300">

        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">
          📤 Upload PDF
        </h2>

        <input
          type="file"
          accept=".pdf"
          onChange={(e) =>
            handlePDFUpload(
              e.target.files[0]
            )
          }
          className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 p-4 rounded-2xl cursor-pointer"
        />

        {selectedFile && (
          <div className="mt-5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-5 space-y-2 border border-transparent dark:border-slate-700/60 text-slate-800 dark:text-slate-200">

            <p>
              <strong>📄 File:</strong>{" "}
              {selectedFile.name}
            </p>

            <p>
              <strong>📦 Size:</strong>{" "}
              {(selectedFile.size / 1024).toFixed(2)}
              {" "}KB
            </p>

            <p>
              <strong>📑 Pages:</strong>{" "}
              {pageCount}
            </p>

            <p>
              <strong>📂 Type:</strong>{" "}
              {documentType}
            </p>

          </div>
        )}

        <button
          onClick={analyzeDocument}
          className="mt-6 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white px-6 py-3 rounded-2xl transition cursor-pointer font-medium"
        >
          🔍 Analyze Document
        </button>

        {
  analysisResult.length > 0 && (
    <div className="mt-8 bg-slate-50 dark:bg-slate-800/80 border border-transparent dark:border-slate-700/60 rounded-3xl p-6">

      {/* Readiness Score */}

      <div className="text-center mb-8">

        <h2 className="text-2xl font-bold">
          📊 Academic Readiness Score
        </h2>

        <div className="text-6xl font-bold text-indigo-600 mt-4">
          {
            Math.round(
              (
                analysisResult.filter(
                  (item) => item.found
                ).length /
                analysisResult.length
              ) * 100
            )
          }%
        </div>

        <div className="mt-5">

  {
    Math.round(
      (
        analysisResult.filter(
          (item) => item.found
        ).length /
        analysisResult.length
      ) * 100
    ) >= 80 ? (

      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 inline-block">

        <div className="text-4xl mb-2">
          🐼✅
        </div>

        <h3 className="font-bold text-green-700 text-xl">
          Panda AI Approved
        </h3>

        <p className="text-green-600 mt-2">
          This document is ready for submission.
        </p>

      </div>

    ) : Math.round(
      (
        analysisResult.filter(
          (item) => item.found
        ).length /
        analysisResult.length
      ) * 100
    ) >= 50 ? (

      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 inline-block">

        <div className="text-4xl mb-2">
          🐼⚠️
        </div>

        <h3 className="font-bold text-yellow-700 text-xl">
          Panda AI Warning
        </h3>

        <p className="text-yellow-600 mt-2">
          Some important sections are missing.
        </p>

      </div>

    ) : (

      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 inline-block">

        <div className="text-4xl mb-2">
          🐼❌
        </div>

        <h3 className="font-bold text-red-700 text-xl">
          Panda AI Rejected
        </h3>

        <p className="text-red-600 mt-2">
          Major improvements required before submission.
        </p>

      </div>

    )
  }

</div>

      </div>

      {/* Document Health Meter */}

<div className="grid md:grid-cols-3 gap-4 mb-8">

  {/* Structure Quality */}

  <div className="bg-white rounded-2xl shadow p-5 text-center">

    <div className="text-4xl mb-3">
      🏗️
    </div>

    <h3 className="font-semibold text-gray-500">
      Structure Quality
    </h3>

    <p className="text-xl font-bold mt-2">

      {
        Math.round(
          (
            analysisResult.filter(
              (item) => item.found
            ).length /
            analysisResult.length
          ) * 100
        ) >= 80
          ? "🟢 Excellent"
          : Math.round(
              (
                analysisResult.filter(
                  (item) => item.found
                ).length /
                analysisResult.length
              ) * 100
            ) >= 50
          ? "🟡 Good"
          : "🔴 Poor"
      }

    </p>

  </div>

  {/* Content Coverage */}

  <div className="bg-white rounded-2xl shadow p-5 text-center">

    <div className="text-4xl mb-3">
      📚
    </div>

    <h3 className="font-semibold text-gray-500">
      Content Coverage
    </h3>

    <p className="text-xl font-bold mt-2">

      {
        analysisResult.filter(
          (item) => item.found
        ).length
      }
      {" / "}
      {analysisResult.length}
      {" Sections"}

    </p>

  </div>

  {/* Submission Risk */}

  <div className="bg-white rounded-2xl shadow p-5 text-center">

    <div className="text-4xl mb-3">
      ⚠️
    </div>

    <h3 className="font-semibold text-gray-500">
      Submission Risk
    </h3>

    <p className="text-xl font-bold mt-2">

      {
        analysisResult.filter(
          (item) => !item.found
        ).length <= 1
          ? "🟢 Low"
          : analysisResult.filter(
              (item) => !item.found
            ).length <= 3
          ? "🟡 Medium"
          : "🔴 High"
      }

    </p>

  </div>

</div>
      {/* Faculty Evaluation */}

<div className="bg-white rounded-3xl shadow-lg p-6 mb-8">

  <h2 className="text-2xl font-bold mb-5">
    👨‍🏫 Faculty Evaluation
  </h2>

  <div className="grid md:grid-cols-3 gap-5">

    {/* Expected Marks */}

    <div className="bg-indigo-50 rounded-2xl p-5 text-center">

      <div className="text-4xl mb-3">
        🎯
      </div>

      <h3 className="text-gray-500">
        Expected Marks
      </h3>

      <p className="text-3xl font-bold text-indigo-600 mt-2">

        {
          Math.round(
            (
              analysisResult.filter(
                (item) => item.found
              ).length /
              analysisResult.length
            ) * 100
          )
        }
        /100

      </p>

    </div>

    {/* Rating */}

    <div className="bg-yellow-50 rounded-2xl p-5 text-center">

      <div className="text-4xl mb-3">
        ⭐
      </div>

      <h3 className="text-gray-500">
        Faculty Rating
      </h3>

      <p className="text-3xl mt-2">

        {
          Math.round(
            (
              analysisResult.filter(
                (item) => item.found
              ).length /
              analysisResult.length
            ) * 100
          ) >= 90
            ? "⭐⭐⭐⭐⭐"
            : Math.round(
                (
                  analysisResult.filter(
                    (item) => item.found
                  ).length /
                  analysisResult.length
                ) * 100
              ) >= 75
            ? "⭐⭐⭐⭐"
            : Math.round(
                (
                  analysisResult.filter(
                    (item) => item.found
                  ).length /
                  analysisResult.length
                ) * 100
              ) >= 50
            ? "⭐⭐⭐"
            : "⭐⭐"
        }

      </p>

    </div>

    {/* Faculty Opinion */}

    <div className="bg-green-50 rounded-2xl p-5 text-center">

      <div className="text-4xl mb-3">
        📝
      </div>

      <h3 className="text-gray-500">
        Faculty Opinion
      </h3>

      <p className="font-semibold mt-2">

        {
          Math.round(
            (
              analysisResult.filter(
                (item) => item.found
              ).length /
              analysisResult.length
            ) * 100
          ) >= 80
            ? "Excellent document structure."
            : Math.round(
                (
                  analysisResult.filter(
                    (item) => item.found
                  ).length /
                  analysisResult.length
                ) * 100
              ) >= 50
            ? "Good document with some improvements needed."
            : "Major improvements required before submission."
        }

      </p>

    </div>

  </div>

</div>
      {
  documentType === "Resume" && (
    <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">

      <h2 className="text-2xl font-bold mb-6">
        💼 Resume Intelligence
      </h2>

      <div className="grid md:grid-cols-3 gap-5">

        {/* ATS Score */}

        <div className="bg-indigo-50 rounded-2xl p-5 text-center">

          <div className="text-4xl mb-3">
            🎯
          </div>

          <h3 className="text-gray-500">
            ATS Score
          </h3>

          <p className="text-3xl font-bold text-indigo-600 mt-2">

            {
              Math.round(
                (
                  analysisResult.filter(
                    (item) => item.found
                  ).length /
                  analysisResult.length
                ) * 100
              )
            }
            /100

          </p>

        </div>

        {/* Placement Status */}

        <div className="bg-green-50 rounded-2xl p-5 text-center">

          <div className="text-4xl mb-3">
            🚀
          </div>

          <h3 className="text-gray-500">
            Placement Status
          </h3>

          <p className="font-bold text-xl mt-2">

            {
              Math.round(
                (
                  analysisResult.filter(
                    (item) => item.found
                  ).length /
                  analysisResult.length
                ) * 100
              ) >= 80
                ? "🟢 Placement Ready"
                : Math.round(
                    (
                      analysisResult.filter(
                        (item) => item.found
                      ).length /
                      analysisResult.length
                    ) * 100
                  ) >= 60
                ? "🟡 Almost Ready"
                : "🔴 Needs Work"
            }

          </p>

        </div>

        {/* Resume Strength */}

        <div className="bg-yellow-50 rounded-2xl p-5 text-center">

          <div className="text-4xl mb-3">
            💪
          </div>

          <h3 className="text-gray-500">
            Resume Strength
          </h3>

          <p className="font-bold text-xl mt-2">

            {
              Math.round(
                (
                  analysisResult.filter(
                    (item) => item.found
                  ).length /
                  analysisResult.length
                ) * 100
              ) >= 80
                ? "Strong"
                : Math.round(
                    (
                      analysisResult.filter(
                        (item) => item.found
                      ).length /
                      analysisResult.length
                    ) * 100
                  ) >= 60
                ? "Average"
                : "Weak"
            }

          </p>

        </div>

      </div>

    </div>
  )
}
    {
  documentType === "Internship Report" && (
    <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">

      <h2 className="text-2xl font-bold mb-6">
        💼 Internship Intelligence
      </h2>

      <div className="grid md:grid-cols-4 gap-5">

        {/* Internship Readiness */}

        <div className="bg-blue-50 rounded-2xl p-5 text-center">

          <div className="text-4xl mb-3">
            🚀
          </div>

          <h3 className="text-gray-500">
            Internship Readiness
          </h3>

          <p className="text-xl font-bold text-blue-600 mt-2">

            {
              Math.round(
                (
                  analysisResult.filter(
                    (item) => item.found
                  ).length /
                  analysisResult.length
                ) * 100
              )
            }%

          </p>

        </div>

        {/* Reporting Quality */}

        <div className="bg-green-50 rounded-2xl p-5 text-center">

          <div className="text-4xl mb-3">
            📑
          </div>

          <h3 className="text-gray-500">
            Reporting Quality
          </h3>

          <p className="font-bold text-lg mt-2">

            {
              Math.round(
                (
                  analysisResult.filter(
                    (item) => item.found
                  ).length /
                  analysisResult.length
                ) * 100
              ) >= 80
                ? "Excellent"
                : Math.round(
                    (
                      analysisResult.filter(
                        (item) => item.found
                      ).length /
                      analysisResult.length
                    ) * 100
                  ) >= 60
                ? "Good"
                : "Needs Improvement"
            }

          </p>

        </div>

        {/* Mentor Impression */}

        <div className="bg-purple-50 rounded-2xl p-5 text-center">

          <div className="text-4xl mb-3">
            👨‍🏫
          </div>

          <h3 className="text-gray-500">
            Mentor Impression
          </h3>

          <p className="font-bold text-lg mt-2">

            {
              Math.round(
                (
                  analysisResult.filter(
                    (item) => item.found
                  ).length /
                  analysisResult.length
                ) * 100
              ) >= 80
                ? "Excellent"
                : Math.round(
                    (
                      analysisResult.filter(
                        (item) => item.found
                      ).length /
                      analysisResult.length
                    ) * 100
                  ) >= 60
                ? "Positive"
                : "Average"
            }

          </p>

        </div>

        {/* Expected Marks */}

        <div className="bg-orange-50 rounded-2xl p-5 text-center">

          <div className="text-4xl mb-3">
            🎯
          </div>

          <h3 className="text-gray-500">
            Expected Marks
          </h3>

          <p className="text-xl font-bold text-orange-600 mt-2">

            {
              Math.round(
                (
                  analysisResult.filter(
                    (item) => item.found
                  ).length /
                  analysisResult.length
                ) * 100
              )
            }
            /100

          </p>

        </div>

      </div>

    </div>
  )
}
    {
  documentType === "Assignment" && (
    <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">

      <h2 className="text-2xl font-bold mb-6">
        📚 Assignment Intelligence
      </h2>

      <div className="grid md:grid-cols-4 gap-5">

        {/* Assignment Quality */}

        <div className="bg-blue-50 rounded-2xl p-5 text-center">

          <div className="text-4xl mb-3">
            📖
          </div>

          <h3 className="text-gray-500">
            Assignment Quality
          </h3>

          <p className="text-xl font-bold text-blue-600 mt-2">

            {
              Math.round(
                (
                  analysisResult.filter(
                    (item) => item.found
                  ).length /
                  analysisResult.length
                ) * 100
              )
            }%

          </p>

        </div>

        {/* Submission Readiness */}

        <div className="bg-green-50 rounded-2xl p-5 text-center">

          <div className="text-4xl mb-3">
            ✅
          </div>

          <h3 className="text-gray-500">
            Submission Status
          </h3>

          <p className="font-bold text-lg mt-2">

            {
              Math.round(
                (
                  analysisResult.filter(
                    (item) => item.found
                  ).length /
                  analysisResult.length
                ) * 100
              ) >= 80
                ? "Ready"
                : Math.round(
                    (
                      analysisResult.filter(
                        (item) => item.found
                      ).length /
                      analysisResult.length
                    ) * 100
                  ) >= 50
                ? "Almost Ready"
                : "Needs Work"
            }

          </p>

        </div>

        {/* Faculty Rating */}

        <div className="bg-purple-50 rounded-2xl p-5 text-center">

          <div className="text-4xl mb-3">
            ⭐
          </div>

          <h3 className="text-gray-500">
            Faculty Rating
          </h3>

          <p className="text-xl mt-2">

            {
              Math.round(
                (
                  analysisResult.filter(
                    (item) => item.found
                  ).length /
                  analysisResult.length
                ) * 100
              ) >= 90
                ? "⭐⭐⭐⭐⭐"
                : Math.round(
                    (
                      analysisResult.filter(
                        (item) => item.found
                      ).length /
                      analysisResult.length
                    ) * 100
                  ) >= 75
                ? "⭐⭐⭐⭐"
                : Math.round(
                    (
                      analysisResult.filter(
                        (item) => item.found
                      ).length /
                      analysisResult.length
                    ) * 100
                  ) >= 50
                ? "⭐⭐⭐"
                : "⭐⭐"
            }

          </p>

        </div>

        {/* Expected Marks */}

        <div className="bg-orange-50 rounded-2xl p-5 text-center">

          <div className="text-4xl mb-3">
            🎯
          </div>

          <h3 className="text-gray-500">
            Expected Marks
          </h3>

          <p className="text-xl font-bold text-orange-600 mt-2">

            {
              Math.round(
                (
                  analysisResult.filter(
                    (item) => item.found
                  ).length /
                  analysisResult.length
                ) * 100
              )
            }
            /100

          </p>

        </div>

      </div>

    </div>
  )
}

    {
  documentType === "Project Report" && (
    <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">

      <h2 className="text-2xl font-bold mb-6">
        🚀 Project Intelligence
      </h2>

      <div className="grid md:grid-cols-4 gap-5">

        {/* Innovation Score */}

        <div className="bg-blue-50 rounded-2xl p-5 text-center">

          <div className="text-4xl mb-3">
            💡
          </div>

          <h3 className="text-gray-500">
            Innovation Score
          </h3>

          <p className="text-xl font-bold text-blue-600 mt-2">

            {
              Math.round(
                (
                  analysisResult.filter(
                    (item) => item.found
                  ).length /
                  analysisResult.length
                ) * 100
              )
            }%

          </p>

        </div>

        {/* Project Readiness */}

        <div className="bg-green-50 rounded-2xl p-5 text-center">

          <div className="text-4xl mb-3">
            🚀
          </div>

          <h3 className="text-gray-500">
            Project Readiness
          </h3>

          <p className="font-bold text-lg mt-2">

            {
              Math.round(
                (
                  analysisResult.filter(
                    (item) => item.found
                  ).length /
                  analysisResult.length
                ) * 100
              ) >= 80
                ? "Ready"
                : Math.round(
                    (
                      analysisResult.filter(
                        (item) => item.found
                      ).length /
                      analysisResult.length
                    ) * 100
                  ) >= 50
                ? "Almost Ready"
                : "Needs Work"
            }

          </p>

        </div>

        {/* Faculty Interest */}

        <div className="bg-purple-50 rounded-2xl p-5 text-center">

          <div className="text-4xl mb-3">
            👨‍🏫
          </div>

          <h3 className="text-gray-500">
            Faculty Interest
          </h3>

          <p className="font-bold text-lg mt-2">

            {
              Math.round(
                (
                  analysisResult.filter(
                    (item) => item.found
                  ).length /
                  analysisResult.length
                ) * 100
              ) >= 80
                ? "High"
                : Math.round(
                    (
                      analysisResult.filter(
                        (item) => item.found
                      ).length /
                      analysisResult.length
                    ) * 100
                  ) >= 50
                ? "Medium"
                : "Low"
            }

          </p>

        </div>

        {/* Expected Viva Marks */}

        <div className="bg-orange-50 rounded-2xl p-5 text-center">

          <div className="text-4xl mb-3">
            🎯
          </div>

          <h3 className="text-gray-500">
            Expected Viva Marks
          </h3>

          <p className="text-xl font-bold text-orange-600 mt-2">

            {
              Math.round(
                (
                  analysisResult.filter(
                    (item) => item.found
                  ).length /
                  analysisResult.length
                ) * 100
              )
            }
            /100

          </p>

        </div>

      </div>

    </div>
  )
}

      {/* Analysis Result */}

      <h2 className="text-2xl font-bold mb-5">
        🔍 Analysis Result
      </h2>

      <div className="space-y-4">

  {analysisResult.map((item) => (

    <div
      key={item.title}
      className="bg-white rounded-2xl p-5 shadow"
    >

      <div className="flex justify-between items-center">

        <span className="font-semibold text-lg">
          {item.title}
        </span>

        <span className="font-medium">
          {item.found
            ? "✅ Found"
            : "❌ Missing"}
        </span>

      </div>

      {!item.found && (

        <div className="mt-4 bg-orange-50 border border-orange-200 rounded-2xl p-4">

          <p className="font-semibold text-orange-700">
            🤖 Panda AI Suggestion
          </p>

          <p className="text-sm text-orange-600 mt-2">
            Consider adding this section to improve the document quality.
          </p>

        </div>

      )}

    </div>

  ))}

</div>

<div className="mt-8 text-center">

  <button
    onClick={downloadReport}
    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg"
  >
    📥 Download Analysis Report
  </button>

</div>

    </div>
  )
}
</div>
      {/* Features */}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="text-5xl mb-4">📤</div>

          <h2 className="text-2xl font-bold">
            PDF Upload
          </h2>

          <ul className="mt-4 text-gray-500 space-y-2">
            <li>• Resume Upload</li>
            <li>• Assignment Upload</li>
            <li>• Project Report Upload</li>
            <li>• Internship Report Upload</li>
          </ul>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="text-5xl mb-4">📊</div>

          <h2 className="text-2xl font-bold">
            PDF Analysis
          </h2>

          <ul className="mt-4 text-gray-500 space-y-2">
            <li>• Page Count</li>
            <li>• Section Detection</li>
            <li>• Missing Content Detection</li>
            <li>• AI Suggestions</li>
          </ul>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="text-5xl mb-4">🤖</div>

          <h2 className="text-2xl font-bold">
            AI Features
          </h2>

          <ul className="mt-4 text-gray-500 space-y-2">
            <li>• AI Summary</li>
            <li>• Important Points</li>
            <li>• Improvement Suggestions</li>
          </ul>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="text-5xl mb-4">🎓</div>

          <h2 className="text-2xl font-bold">
            Student Tools
          </h2>

          <ul className="mt-4 text-gray-500 space-y-2">
            <li>• Resume Checker</li>
            <li>• Assignment Checker</li>
            <li>• Internship Report Checker</li>
            <li>• Project Report Checker</li>
          </ul>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="text-5xl mb-4">📥</div>

          <h2 className="text-2xl font-bold">
            Report Generator
          </h2>

          <ul className="mt-4 text-gray-500 space-y-2">
            <li>• Download Analysis Report</li>
            <li>• PDF Export</li>
            <li>• Improvement Suggestions</li>
          </ul>
        </div>

      </div>

    </MainLayout>
  );
}

export default PDFManager;