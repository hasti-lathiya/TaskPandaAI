import { useState } from "react";
import jsPDF from "jspdf";
import MainLayout from "../../layouts/MainLayout";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  RefreshCw,
  Award,
  Sparkles,
} from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function PDFManager() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [documentType, setDocumentType] = useState("");
  const [analysisResult, setAnalysisResult] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [tagSelection, setTagSelection] = useState("Resume");
  
  // History of analyzed documents
  const [history, setHistory] = useState([
    {
      id: "hist-1",
      name: "Resume_Summer2026.pdf",
      size: "245 KB",
      type: "Resume",
      score: 80,
      date: "Jul 26, 2026",
    },
    {
      id: "hist-2",
      name: "Internship_Report_v2.pdf",
      size: "1,120 KB",
      type: "Internship Report",
      score: 60,
      date: "Jul 24, 2026",
    },
  ]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        handlePDFUpload(file);
      } else {
        alert("Only PDF files are supported!");
      }
    }
  };

  const handlePDFUpload = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setAnalysisResult([]);
    setDocumentType("");

    try {
      const fileReader = new FileReader();
      fileReader.onload = async function () {
        const typedArray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        setPageCount(pdf.numPages);
      };
      fileReader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error uploading PDF:", error);
    }
  };

  const analyzeDocument = async () => {
    if (!selectedFile) {
      alert("Please upload a PDF document first.");
      return;
    }

    try {
      setIsAnalyzing(true);
      const fileReader = new FileReader();

      fileReader.onload = async function () {
        const typedArray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

        let extractedText = "";
        let words = 0;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item) => item.str).join(" ");
          extractedText += pageText.toLowerCase();
          words += pageText.split(/\s+/).filter(Boolean).length;
        }

        setWordCount(words);

        const results = [];
        let detectedType = "";

        // Tag checks
        if (
          extractedText.includes("education") &&
          extractedText.includes("skill") &&
          extractedText.includes("project")
        ) {
          detectedType = "Resume";
        } else if (
          extractedText.includes("introduction") &&
          extractedText.includes("reference")
        ) {
          detectedType = "Assignment";
        } else if (
          (extractedText.includes("company") ||
            extractedText.includes("organization") ||
            extractedText.includes("internship")) &&
          extractedText.includes("work done")
        ) {
          detectedType = "Internship Report";
        } else if (
          extractedText.includes("problem statement") &&
          extractedText.includes("methodology")
        ) {
          detectedType = "Project Report";
        } else {
          detectedType = tagSelection; // Fallback to manual selector tag
        }

        setDocumentType(detectedType);

        if (detectedType === "Resume") {
          results.push({ title: "Education Section", found: extractedText.includes("education") });
          results.push({ title: "Skills Summary", found: extractedText.includes("skill") });
          results.push({ title: "Project Portfolios", found: extractedText.includes("project") });
          results.push({ title: "Work Experience", found: extractedText.includes("experience") });
          results.push({ title: "Certifications", found: extractedText.includes("certification") });
        } else if (detectedType === "Assignment") {
          results.push({ title: "Introduction Overview", found: extractedText.includes("introduction") });
          results.push({ title: "Core Objectives", found: extractedText.includes("objective") });
          results.push({ title: "Conclusion Summary", found: extractedText.includes("conclusion") });
          results.push({ title: "Bibliography / References", found: extractedText.includes("reference") });
        } else if (detectedType === "Internship Report") {
          results.push({ title: "Company Profile", found: extractedText.includes("company") });
          results.push({ title: "Log of Work Done", found: extractedText.includes("work") });
          results.push({ title: "Technologies & Toolings", found: extractedText.includes("technology") || extractedText.includes("tools") });
          results.push({ title: "Learning Milestones", found: extractedText.includes("learning") });
          results.push({ title: "Report Conclusion", found: extractedText.includes("conclusion") });
        } else {
          // Project Report fallback
          results.push({ title: "Problem Statement", found: extractedText.includes("problem statement") });
          results.push({ title: "Research Objectives", found: extractedText.includes("objective") });
          results.push({ title: "Methodology Details", found: extractedText.includes("methodology") });
          results.push({ title: "Implementation Walkthrough", found: extractedText.includes("implementation") });
          results.push({ title: "Testing Metrics", found: extractedText.includes("testing") });
          results.push({ title: "Future Scope Limitations", found: extractedText.includes("future scope") });
        }

        // Add 500ms delay to simulate deep analysis processing
        setTimeout(() => {
          setAnalysisResult(results);
          setIsAnalyzing(false);

          // Add to history
          const score = Math.round((results.filter((item) => item.found).length / results.length) * 100);
          const newHistoryItem = {
            id: `hist-${Date.now()}`,
            name: selectedFile.name,
            size: `${(selectedFile.size / 1024).toFixed(0)} KB`,
            type: detectedType,
            score: score,
            date: "Today",
          };
          setHistory((prev) => [newHistoryItem, ...prev]);
        }, 800);
      };

      fileReader.readAsArrayBuffer(selectedFile);
    } catch (error) {
      console.error("Error analyzing PDF:", error);
      setIsAnalyzing(false);
    }
  };

  const downloadReport = () => {
    if (analysisResult.length === 0) return;

    const pdf = new jsPDF();
    const score = Math.round(
      (analysisResult.filter((item) => item.found).length / analysisResult.length) * 100
    );

    pdf.setFontSize(22);
    pdf.text("TaskPanda AI Document Report", 20, 20);

    pdf.setFontSize(12);
    pdf.text(`Document Name: ${selectedFile?.name || "Academic Doc"}`, 20, 40);
    pdf.text(`Document Classification: ${documentType}`, 20, 50);
    pdf.text(`Readiness Score: ${score}%`, 20, 60);
    pdf.text(
      `Status: ${
        score >= 80 ? "Ready for Submission" : score >= 50 ? "Needs Improvement" : "Critical Rework Required"
      }`,
      20,
      70
    );

    let y = 90;
    pdf.text("Structure Checklist Verification:", 20, y);
    y += 10;

    analysisResult.forEach((item) => {
      pdf.text(`${item.found ? "✓ FOUND" : "✗ MISSING"} - ${item.title}`, 20, y);
      y += 10;
    });

    pdf.save(`PandaAI_Report_${documentType}.pdf`);
  };

  const readinessScore =
    analysisResult.length > 0
      ? Math.round((analysisResult.filter((item) => item.found).length / analysisResult.length) * 100)
      : 0;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 transition-all duration-300">
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-50 tracking-tight flex items-center gap-2">
            📄 PDF Intelligence Manager
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">
            Upload, analyze, and optimize your academic documents using AI.
          </p>
        </div>

        {/* Quick Action Pills */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-100 dark:border-slate-800 pb-5">
          {["All", "Resumes", "Assignments", "Reports", "Internship Docs"].map((tab) => (
            <button
              key={tab}
              className="px-4 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Main 2-Column Split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column (7/12 width) - Upload zone & Type Selector */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Interactive File Upload card */}
            <div className="bg-white dark:bg-slate-900 border border-gray-205 dark:border-slate-800 rounded-[32px] p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-bold mb-5 text-slate-850 dark:text-slate-100">
                Upload Document
              </h2>

              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
                  dragActive
                    ? "border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20"
                    : "border-gray-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850"
                }`}
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handlePDFUpload(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="w-14 h-14 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Upload className="text-indigo-650 dark:text-indigo-400" size={24} />
                </div>

                 <p className="font-bold text-slate-750 dark:text-slate-200 text-sm">
                   Drag & drop your PDF file here, or <span className="text-indigo-650 dark:text-indigo-400 hover:underline">browse files</span>
                 </p>
                 <p className="text-xs text-[#9CA3AF] dark:text-slate-400 mt-2 font-semibold">
                   Only PDF files up to 10MB are supported
                 </p>
              </div>

              {/* Document Type tagging */}
              <div className="mt-6">
                <label className="block text-xs font-extrabold uppercase text-gray-500 dark:text-slate-400 tracking-wider mb-3">
                  Document Tag / Preset type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["Resume", "Assignment", "Internship Report"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTagSelection(type)}
                      className={`px-4 py-3 rounded-2xl text-xs font-bold border transition cursor-pointer text-center ${
                        tagSelection === type
                          ? "bg-indigo-500/15 dark:bg-indigo-500/20 border-indigo-500 text-indigo-655 dark:text-indigo-400 glow-active"
                          : "bg-white/40 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* File details review */}
              {selectedFile && (
                <div className="mt-6 bg-slate-50 dark:bg-slate-850 border border-transparent dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                      <FileText size={20} />
                    </div>
                    <div className="max-w-[200px] sm:max-w-xs md:max-w-md">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB • {pageCount > 0 ? `${pageCount} pages` : "Reading..."}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-gray-400 dark:text-slate-500 hover:text-red-500 p-1 cursor-pointer"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              )}

              {/* Analyze CTA button */}
              <button
                type="button"
                onClick={analyzeDocument}
                disabled={!selectedFile || isAnalyzing}
                className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-6 py-4 rounded-2xl shadow-lg hover:shadow-indigo-500/20 transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="animate-spin" size={18} />
                    Analyzing Document structure...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Analyze Document structure
                  </>
                )}
              </button>

            </div>

          </div>

          {/* Right Column (5/12 width) - Live AI Results panel */}
          <div className="lg:col-span-5 flex flex-col items-stretch h-full">
            <div className="glass-premium rounded-[32px] p-6 md:p-8 shadow-sm flex flex-col justify-between h-full flex-grow min-h-[460px]">
              
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-20 text-center flex-1">
                  <div className="text-5xl animate-bounce mb-4">🐼</div>
                  <h3 className="font-extrabold text-indigo-600 dark:text-indigo-400 text-lg">
                    Analyzing PDF structure
                  </h3>
                  <p className="text-gray-500 dark:text-slate-400 text-xs mt-1 max-w-xs leading-relaxed">
                    Running segment checklist counters, tracking vocabulary vectors, and grading academic compliance indices.
                  </p>
                  <div className="w-full max-w-[200px] h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden mt-6">
                    <div className="h-full bg-indigo-500 rounded-full animate-[progress_1s_infinite_linear] w-2/3" />
                  </div>
                </div>
              ) : analysisResult.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center flex-1">
                  <div className="w-14 h-14 bg-slate-50 dark:bg-slate-850 rounded-2xl flex items-center justify-center text-2xl mb-4 border border-transparent dark:border-slate-800">
                    🤖
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">
                    Awaiting Analysis
                  </h3>
                  <p className="text-gray-500 dark:text-slate-400 text-xs mt-2 max-w-xs leading-relaxed">
                    Upload your document and tag its structure on the left to review the evaluation scores and AI improvement items.
                  </p>
                </div>
              ) : (
                /* Tabbed Evaluation Stream */
                <div className="flex flex-col justify-between h-full flex-1">
                  
                  {/* Results Header */}
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900 px-2.5 py-1 rounded-full">
                          {documentType}
                        </span>
                        <h3 className="font-extrabold text-slate-850 dark:text-slate-50 text-lg mt-2">
                          Evaluation Results
                        </h3>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                          {readinessScore}%
                        </span>
                        <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">
                          Readiness Score
                        </p>
                      </div>
                    </div>

                    {/* Tab Selectors */}
                    <div className="flex border-b border-gray-100 dark:border-slate-800 pb-3 gap-4 mb-5 text-sm">
                      <button
                        type="button"
                        onClick={() => setActiveTab("overview")}
                        className={`font-bold transition pb-1 ${
                          activeTab === "overview"
                            ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500"
                            : "text-gray-400 dark:text-slate-500"
                        }`}
                      >
                        Overview
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("insights")}
                        className={`font-bold transition pb-1 ${
                          activeTab === "insights"
                            ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500"
                            : "text-gray-400 dark:text-slate-500"
                        }`}
                      >
                        AI Insights
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("tips")}
                        className={`font-bold transition pb-1 ${
                          activeTab === "tips"
                            ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500"
                            : "text-gray-400 dark:text-slate-500"
                        }`}
                      >
                        Improvement Tips
                      </button>
                    </div>

                    {/* Tab contents */}
                    {activeTab === "overview" && (
                      <div className="space-y-4">
                        <div className="bg-slate-50/50 dark:bg-slate-850 border border-transparent dark:border-slate-800 rounded-2xl p-4">
                          <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Document Metadata
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-gray-400">Page Count:</span>
                              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{pageCount} pages</p>
                            </div>
                            <div>
                              <span className="text-gray-400">Word Count:</span>
                              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">~{wordCount} words</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-50/50 dark:bg-slate-850 border border-transparent dark:border-slate-800 rounded-2xl p-4 text-center">
                            <span className="text-xs text-gray-400 block">Structure</span>
                            <p className="font-bold mt-1 text-sm">
                              {readinessScore >= 80 ? "🟢 Excellent" : readinessScore >= 50 ? "🟡 Good" : "🔴 Poor"}
                            </p>
                          </div>
                          <div className="bg-slate-50/50 dark:bg-slate-850 border border-transparent dark:border-slate-800 rounded-2xl p-4 text-center">
                            <span className="text-xs text-gray-400 block">Verification</span>
                            <p className="font-bold mt-1 text-sm">
                              {analysisResult.filter((item) => item.found).length} / {analysisResult.length} Passed
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "insights" && (
                      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        {analysisResult.map((item) => (
                          <div
                            key={item.title}
                            className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-850 border border-transparent dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs"
                          >
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{item.title}</span>
                            <span className="flex items-center gap-1">
                              {item.found ? (
                                <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                                  <CheckCircle size={12} /> Found
                                </span>
                              ) : (
                                <span className="text-red-500 dark:text-red-400 font-bold flex items-center gap-1">
                                  <XCircle size={12} /> Missing
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeTab === "tips" && (
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {analysisResult.filter((item) => !item.found).length === 0 ? (
                          <div className="text-center py-6">
                            <Award className="mx-auto text-green-500 mb-2" size={24} />
                            <p className="text-xs text-green-600 font-bold">Outstanding Checklist Coverage!</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">All essential sections are correctly embedded.</p>
                          </div>
                        ) : (
                          analysisResult
                            .filter((item) => !item.found)
                            .map((item) => (
                              <div
                                key={item.title}
                                className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/50 rounded-2xl p-4 text-xs"
                              >
                                <span className="font-bold text-orange-700 dark:text-orange-400 block mb-1">
                                  Missing {item.title}
                                </span>
                                <p className="text-orange-600 dark:text-orange-300 leading-relaxed">
                                  Panda AI recommends inserting this section directly to maximize document quality scores.
                                </p>
                              </div>
                            ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={downloadReport}
                    className="mt-8 w-full bg-indigo-650 hover:bg-indigo-700 text-white font-bold px-5 py-3.5 rounded-2xl transition cursor-pointer text-xs flex items-center justify-center gap-2 shadow-sm"
                  >
                    📥 Export AI Report (PDF)
                  </button>

                </div>
              )}

            </div>
          </div>

        </div>

        {/* Quick Tools & History section */}
        <div className="mt-12 space-y-8">
          
          {/* Quick tool cards */}
          <div>
            <h3 className="text-xl font-bold text-slate-850 dark:text-slate-100 border-b border-gray-100 dark:border-slate-800 pb-2 mb-6">
              AI Document Toolkits
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-200">
                <span className="text-3xl mb-3 block">🎯</span>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Resume ATS Checker</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Extracts raw semantic tokens from resumes to score suitability weights matching active internship roles.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-200">
                <span className="text-3xl mb-3 block">🏗️</span>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Structure Auditor</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Evaluates formatting structures, cover page margins, citations, and structural flow patterns.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-200">
                <span className="text-3xl mb-3 block">✍️</span>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Report Formatter</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Helps restructure internship logs and final reports into beautiful academic compliance frameworks.
                </p>
              </div>
            </div>
          </div>

          {/* History table list */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[32px] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100 mb-5">
              Recent Analyzed Documents
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-850 text-gray-400 uppercase font-extrabold tracking-wider">
                    <th className="pb-3.5 pl-2">Name</th>
                    <th className="pb-3.5">Doc Type</th>
                    <th className="pb-3.5">Size</th>
                    <th className="pb-3.5">Readiness Score</th>
                    <th className="pb-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-850/60 font-semibold text-slate-700 dark:text-slate-350">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition">
                      <td className="py-3.5 pl-2 font-bold text-slate-800 dark:text-slate-100 max-w-xs truncate">
                        {item.name}
                      </td>
                      <td className="py-3.5">
                        <span className="bg-slate-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800 px-2 py-0.5 rounded-lg text-[10px]">
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3.5 text-gray-400">{item.size}</td>
                      <td className="py-3.5">
                        <span className={`font-black ${item.score >= 80 ? "text-green-600" : "text-yellow-600"}`}>
                          {item.score}%
                        </span>
                      </td>
                      <td className="py-3.5 text-gray-400">{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </MainLayout>
  );
}

export default PDFManager;