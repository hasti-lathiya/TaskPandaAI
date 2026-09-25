import { useEffect, useRef, useState } from "react";
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
  Trash2,
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FlaskConical,
  Send,
  MessageSquare,
  Bot,
} from "lucide-react";
import {
  analyzePDFDocument,
  askPdfQuestion,
  FALLBACK_CHECKLISTS,
  DEFAULT_FALLBACK_CHECKLIST,
} from "../../services/gemini";
import {
  DOCUMENT_TYPES,
  validatePdfFile,
  createPdfDocumentRecord,
  fetchUserPdfDocuments,
  updatePdfDocumentMeta,
  deletePdfDocument,
} from "../../services/pdfService";
import { awardXp } from "../../services/rewards";
import { runAchievementChecks } from "../../services/achievements";
import { auth } from "../../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNotifications } from "../../context/NotificationContext";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const FILTERS = [
  { label: "All Documents", value: "All" },
  { label: "📜 Contracts", value: "Contract / Agreement" },
  { label: "📈 Proposals", value: "Business Proposal" },
  { label: "📑 Invoices", value: "Invoice / Receipt" },
  { label: "📝 Meeting Minutes", value: "Meeting Minutes" },
  { label: "🔬 Research Papers", value: "Research Paper" },
  { label: "📚 Study Notes", value: "Study Notes" },
  { label: "🎯 Resumes", value: "Resume" },
  { label: "✍️ Assignments", value: "Assignment" },
  { label: "📊 Project Reports", value: "Project Report" },
  { label: "🏢 Internship Reports", value: "Internship Report" },
  { label: "📖 General", value: "General Document" },
];

const PRESET_GROUPS = [
  {
    category: "Professional & Business",
    icon: "💼",
    items: [
      { id: "Contract / Agreement", label: "Contract / Agreement", emoji: "📜", desc: "Terms, obligations & NDA" },
      { id: "Business Proposal", label: "Business Proposal", emoji: "📈", desc: "Executive summary & budget" },
      { id: "Invoice / Receipt", label: "Invoice / Receipt", emoji: "📑", desc: "Line items & amounts due" },
      { id: "Meeting Minutes", label: "Meeting Minutes", emoji: "📝", desc: "Decisions & action items" },
    ],
  },
  {
    category: "Academic & Research",
    icon: "🎓",
    items: [
      { id: "Research Paper", label: "Research Paper", emoji: "🔬", desc: "Abstract, methodology & data" },
      { id: "Study Notes", label: "Study Notes", emoji: "📚", desc: "Concepts, definitions & review" },
      { id: "Assignment", label: "Assignment", emoji: "✍️", desc: "Prompt, analysis & references" },
      { id: "Project Report", label: "Project Report", emoji: "📊", desc: "Architecture, testing & scope" },
    ],
  },
  {
    category: "Career & Universal",
    icon: "📄",
    items: [
      { id: "Resume", label: "Resume / CV", emoji: "🎯", desc: "Experience, skills & impact" },
      { id: "Internship Report", label: "Internship Report", emoji: "🏢", desc: "Company work & learnings" },
      { id: "General Document", label: "General Document", emoji: "📖", desc: "Universal summary & takeaways" },
    ],
  },
];

const SAMPLE_DEMO_PDFS = [
  {
    type: "Contract / Agreement",
    emoji: "📜",
    category: "Professional & Business",
    fileName: "01_Contract_Agreement_Sample.pdf",
    label: "Sample Contract (MSA & NDA)",
  },
  {
    type: "Business Proposal",
    emoji: "📈",
    category: "Professional & Business",
    fileName: "02_Business_Proposal_Sample.pdf",
    label: "Enterprise AI Proposal",
  },
  {
    type: "Invoice / Receipt",
    emoji: "📑",
    category: "Professional & Business",
    fileName: "03_Invoice_Receipt_Sample.pdf",
    label: "Commercial Tax Invoice",
  },
  {
    type: "Meeting Minutes",
    emoji: "📝",
    category: "Professional & Business",
    fileName: "04_Meeting_Minutes_Sample.pdf",
    label: "Sprint Planning Minutes",
  },
  {
    type: "Research Paper",
    emoji: "🔬",
    category: "Academic & Research",
    fileName: "05_Research_Paper_Sample.pdf",
    label: "LLM Agentic Research Paper",
  },
  {
    type: "Study Notes",
    emoji: "📚",
    category: "Academic & Research",
    fileName: "06_Study_Notes_Sample.pdf",
    label: "DSA Revision Notes",
  },
  {
    type: "Resume",
    emoji: "🎯",
    category: "Career & Universal",
    fileName: "07_Resume_Sample.pdf",
    label: "Full Stack Engineer Resume",
  },
  {
    type: "Assignment",
    emoji: "✍️",
    category: "Academic & Research",
    fileName: "08_Assignment_Sample.pdf",
    label: "Deep Learning Assignment",
  },
  {
    type: "Project Report",
    emoji: "📊",
    category: "Academic & Research",
    fileName: "09_Project_Report_Sample.pdf",
    label: "TaskPanda AI Capstone Report",
  },
  {
    type: "Internship Report",
    emoji: "🏢",
    category: "Career & Universal",
    fileName: "10_Internship_Report_Sample.pdf",
    label: "CloudScale Internship Report",
  },
  {
    type: "General Document",
    emoji: "📖",
    category: "Career & Universal",
    fileName: "11_General_Document_Sample.pdf",
    label: "Enterprise Policy & SOP",
  },
];

function findCategoryForPreset(presetId) {
  for (const group of PRESET_GROUPS) {
    if (group.items.some((item) => item.id === presetId)) {
      return group.category;
    }
  }
  return "Professional & Business";
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function formatFileSize(bytes) {
  if (!bytes) return "0 KB";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function formatDate(timestamp) {
  if (!timestamp) return "—";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function PDFManager() {
  const { addToast, addNotification } = useNotifications();
  const uploadZoneRef = useRef(null);

  const [userId, setUserId] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [documentType, setDocumentType] = useState("");
  const [analysisResult, setAnalysisResult] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [aiTips, setAiTips] = useState([]);
  const [aiSummary, setAiSummary] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [tagSelection, setTagSelection] = useState("General Document");
  const [selectedCategory, setSelectedCategory] = useState("Career & Universal");
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [loadingSampleFile, setLoadingSampleFile] = useState(null);

  // Document raw text & Q&A Chat
  const [rawDocumentText, setRawDocumentText] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isAskingAI, setIsAskingAI] = useState(false);
  const chatScrollRef = useRef(null);

  const [isUploading, setIsUploading] = useState(false);
  const [currentDocId, setCurrentDocId] = useState(null);

  // Real Firestore-backed history
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [deletingId, setDeletingId] = useState(null);
  const [docPendingDelete, setDocPendingDelete] = useState(null);

  // Filter Pills Horizontal Scrolling
  const filtersScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkFilterScroll = () => {
    if (filtersScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = filtersScrollRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
    }
  };

  useEffect(() => {
    const timer = setTimeout(checkFilterScroll, 120);
    window.addEventListener("resize", checkFilterScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkFilterScroll);
    };
  }, []);

  const scrollFilters = (direction) => {
    if (filtersScrollRef.current) {
      const scrollAmount = direction === "left" ? -260 : 260;
      filtersScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkFilterScroll, 350);
    }
  };

  const loadHistory = async (uid) => {
    setHistoryLoading(true);
    try {
      const docs = await fetchUserPdfDocuments(uid);
      setHistory(docs);
    } catch (error) {
      console.error("Failed to load PDF history:", error);
      addToast("Failed to load your document history.", "error");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        loadHistory(user.uid);
      } else {
        setUserId(null);
        setHistory([]);
        setHistoryLoading(false);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      handlePDFUpload(e.dataTransfer.files[0]);
    }
  };

  const handlePDFUpload = async (file) => {
    if (!file) return;

    const validation = validatePdfFile(file);
    if (!validation.valid) {
      addToast(validation.error, "error");
      return;
    }

    if (!userId) {
      addToast("Please sign in to upload documents.", "error");
      return;
    }

    setSelectedFile(file);
    setAnalysisResult([]);
    setAiInsights([]);
    setAiTips([]);
    setAiSummary("");
    setDocumentType("");
    setRawDocumentText("");
    setChatMessages([]);
    setChatInput("");
    setCurrentDocId(null);
    setWordCount(0);
    setPageCount(0);
    setIsUploading(true);

    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const typedArray = new Uint8Array(arrayBuffer);
      const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
      setPageCount(pdf.numPages);

      const uploaded = await createPdfDocumentRecord({
        file,
        userId,
        documentType: tagSelection,
        pageCount: pdf.numPages,
        wordCount: 0,
      });

      setCurrentDocId(uploaded.id);
      setHistory((prev) => [uploaded, ...prev]);

      try {
        await awardXp(userId, { xp: 5 });
      } catch (xpError) {
        console.error("Failed to award PDF upload XP:", xpError);
      }

      runAchievementChecks(userId, { addNotification }).catch((err) =>
        console.error("Achievement check failed:", err)
      );

      await addNotification("PDF Document Added 📄", `"${file.name}" uploaded to your library (+5 XP)`, "system");
      addToast(`"${file.name}" ready to analyse! +5 XP 🪙`, "success");
    } catch (error) {
      console.error("Error uploading PDF:", error);
      addToast(error.message || "Failed to upload PDF. Please try again.", "error");
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const loadDemoSamplePDF = async (sample) => {
    if (!userId) {
      addToast("Please sign in first to test documents.", "error");
      return;
    }
    setLoadingSampleFile(sample.fileName);
    try {
      const response = await fetch(`/sample_test_pdfs/${sample.fileName}`);
      if (!response.ok) {
        throw new Error("Could not fetch sample test PDF from server.");
      }
      const blob = await response.blob();
      const file = new File([blob], sample.fileName, { type: "application/pdf" });
      setTagSelection(sample.type);
      setSelectedCategory(sample.category);
      await handlePDFUpload(file);
      setShowDemoModal(false);
      addToast(`Loaded "${sample.label}"! Click "Analyze with AI" below.`, "success");
    } catch (err) {
      console.error("Failed to load demo PDF:", err);
      addToast("Failed to load demo test PDF.", "error");
    } finally {
      setLoadingSampleFile(null);
    }
  };

  const downloadSamplePDF = (fileName, e) => {
    e?.stopPropagation();
    const link = document.createElement("a");
    link.href = `/sample_test_pdfs/${fileName}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Downloading ${fileName}`, "info");
  };

  const analyzeDocument = async () => {
    if (!selectedFile) {
      addToast("Please upload a PDF document first.", "error");
      return;
    }

    try {
      setIsAnalyzing(true);
      const fileReader = new FileReader();

      fileReader.onload = async function () {
        const typedArray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

        let extractedText = "";
        let originalText = "";
        let words = 0;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item) => item.str).join(" ");
          originalText += pageText + "\n";
          extractedText += pageText.toLowerCase() + " ";
          words += pageText.split(/\s+/).filter(Boolean).length;
        }

        setWordCount(words);
        setRawDocumentText(originalText);

        let detectedType = tagSelection || "General Document";

        // Intelligent auto-detection if text contains strong domain markers
        if (
          extractedText.includes("meeting minutes") ||
          (extractedText.includes("attendees") && (extractedText.includes("action items") || extractedText.includes("agenda")))
        ) {
          detectedType = "Meeting Minutes";
        } else if (
          (extractedText.includes("agreement") || extractedText.includes("contract")) &&
          (extractedText.includes("parties") || extractedText.includes("governing law") || extractedText.includes("terms and conditions") || extractedText.includes("non-disclosure"))
        ) {
          detectedType = "Contract / Agreement";
        } else if (
          (extractedText.includes("invoice") || extractedText.includes("receipt")) &&
          (extractedText.includes("amount due") || extractedText.includes("subtotal") || extractedText.includes("billed to") || extractedText.includes("tax invoice"))
        ) {
          detectedType = "Invoice / Receipt";
        } else if (
          extractedText.includes("abstract") &&
          extractedText.includes("methodology") &&
          (extractedText.includes("references") || extractedText.includes("citations"))
        ) {
          detectedType = "Research Paper";
        } else if (
          (extractedText.includes("internship report") || (extractedText.includes("internship") && extractedText.includes("company"))) &&
          (extractedText.includes("work done") || extractedText.includes("learning milestones"))
        ) {
          detectedType = "Internship Report";
        } else if (
          extractedText.includes("proposal") &&
          (extractedText.includes("deliverables") || extractedText.includes("executive summary") || extractedText.includes("budget") || extractedText.includes("pricing"))
        ) {
          detectedType = "Business Proposal";
        } else if (
          extractedText.includes("project report") ||
          (extractedText.includes("problem statement") && (extractedText.includes("methodology") || extractedText.includes("system architecture") || extractedText.includes("testing metrics")))
        ) {
          detectedType = "Project Report";
        } else if (
          extractedText.includes("curriculum vitae") ||
          (extractedText.includes("education") && extractedText.includes("skill") && (extractedText.includes("experience") || extractedText.includes("projects")))
        ) {
          detectedType = "Resume";
        } else if (
          extractedText.includes("study notes") ||
          (extractedText.includes("chapter") && (extractedText.includes("definition") || extractedText.includes("formulas") || extractedText.includes("review questions")))
        ) {
          detectedType = "Study Notes";
        } else if (
          extractedText.includes("assignment") &&
          (extractedText.includes("objectives") || extractedText.includes("findings") || extractedText.includes("introduction") || extractedText.includes("conclusion"))
        ) {
          detectedType = "Assignment";
        }

        setDocumentType(detectedType);
        setTagSelection(detectedType);
        setSelectedCategory(findCategoryForPreset(detectedType));
        setChatMessages([
          {
            role: "assistant",
            text: `Hello! I've audited this ${detectedType}. You can ask me any specific question about clauses, obligations, risks, numbers, or key takeaways.`,
          },
        ]);

        // Keep the uploaded document's Firestore record linked to this analysis
        const syncDocMeta = async (score) => {
          if (!currentDocId) return;
          try {
            await updatePdfDocumentMeta(currentDocId, {
              wordCount: words,
              documentType: detectedType,
              readinessScore: score,
            });
            setHistory((prev) =>
              prev.map((h) =>
                h.id === currentDocId
                  ? { ...h, wordCount: words, documentType: detectedType, readinessScore: score }
                  : h
              )
            );
          } catch (err) {
            console.error("Failed to sync analysis metadata to document record:", err);
          }
        };

        try {
          const geminiResult = await analyzePDFDocument(detectedType, originalText || extractedText);
          const results = geminiResult.checklist || [];
          setAnalysisResult(results);
          setAiInsights(geminiResult.insights || []);
          setAiTips(geminiResult.tips || []);
          setAiSummary(geminiResult.summary || "Done auditing document.");

          const score = results.length > 0 ? Math.round((results.filter((item) => item.found).length / results.length) * 100) : 0;
          await syncDocMeta(score);
        } catch (err) {
          console.error("Failed to run Gemini analysis:", err);
          // Graceful fallback to static checklist analysis if Gemini fails
          const titles = FALLBACK_CHECKLISTS[detectedType] || DEFAULT_FALLBACK_CHECKLIST;
          const fallbackResults = titles.map((title) => ({
            title,
            found: extractedText.includes(title.split(" ")[0].toLowerCase()),
          }));
          setAnalysisResult(fallbackResults);
          setAiInsights(["Analysis completed via structural fallback.", "Ensure margins and formatting follow standard guidelines."]);
          setAiTips(["Panda AI recommends inserting any missing checklist sections."]);
          setAiSummary(`Document audited as ${detectedType}. Core sections analyzed.`);

          const score = fallbackResults.length > 0 ? Math.round((fallbackResults.filter((item) => item.found).length / fallbackResults.length) * 100) : 0;
          await syncDocMeta(score);
        } finally {
          setIsAnalyzing(false);
        }
      };

      // Without this, a read failure never reaches the onload handler and
      // isAnalyzing stays true forever, leaving the spinner stuck.
      fileReader.onerror = () => {
        console.error("Error reading PDF for analysis:", fileReader.error);
        addToast("Could not read that PDF. Please try uploading it again.", "error");
        setIsAnalyzing(false);
      };

      fileReader.readAsArrayBuffer(selectedFile);
    } catch (error) {
      console.error("Error analyzing PDF:", error);
      addToast("Could not analyse that PDF. Please try again.", "error");
      setIsAnalyzing(false);
    }
  };

  const handleSendQuestion = async (presetQuestion) => {
    const q = (presetQuestion || chatInput).trim();
    if (!q || isAskingAI) return;

    if (!rawDocumentText) {
      addToast("Please analyze the document first before asking questions.", "warning");
      return;
    }

    const userMsg = { role: "user", text: q };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsAskingAI(true);

    try {
      const answer = await askPdfQuestion(q, rawDocumentText, documentType || tagSelection);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: answer || "I analyzed the document, but could not locate specific text matching that question.",
        },
      ]);
    } catch (err) {
      console.error("Failed to answer document question:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I encountered an error while processing that question. Please try again.",
        },
      ]);
    } finally {
      setIsAskingAI(false);
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 100);
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

    // A4 is ~297mm tall; without a page break the checklist silently runs off
    // the bottom once the list grows past roughly twenty rows.
    const PAGE_BOTTOM = 280;
    const LINE_HEIGHT = 10;

    let y = 90;
    pdf.text("Structure Checklist Verification:", 20, y);
    y += LINE_HEIGHT;

    analysisResult.forEach((item) => {
      if (y > PAGE_BOTTOM) {
        pdf.addPage();
        y = 20;
      }

      pdf.text(`${item.found ? "✓ FOUND" : "✗ MISSING"} - ${item.title}`, 20, y);
      y += LINE_HEIGHT;
    });

    pdf.save(`PandaAI_Report_${documentType}.pdf`);
  };

  // View/Download were removed with file storage: only the analysis is kept,
  // not the PDF itself. The original file stays on the user's own machine.

  const handleDelete = async (docItem) => {
    if (!docItem) return;

    setDocPendingDelete(null);
    setDeletingId(docItem.id);
    try {
      await deletePdfDocument({ id: docItem.id });
      setHistory((prev) => prev.filter((h) => h.id !== docItem.id));
      if (currentDocId === docItem.id) {
        setCurrentDocId(null);
      }
      addToast("Document deleted successfully.", "success");
    } catch (error) {
      console.error("Error deleting document:", error);
      addToast(error.message || "Failed to delete document.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const deleteDialog = docPendingDelete ? (
    <div
      className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-3.5 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-doc-title"
    >
      <div className="absolute inset-0" onClick={() => setDocPendingDelete(null)} />

      <div className="relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl sm:rounded-[32px] p-5 sm:p-8 w-full max-w-md shadow-2xl shadow-slate-900/20 dark:shadow-black/50 ring-1 ring-slate-900/5 dark:ring-white/10">
        <h2
          id="delete-doc-title"
          className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100"
        >
          Delete this document?
        </h2>

        <p className="text-gray-500 dark:text-slate-400 mt-2 sm:mt-3 text-xs sm:text-sm break-words">
          “{docPendingDelete.fileName}” will be permanently removed. This can't
          be undone.
        </p>

        <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 mt-6 sm:mt-8">
          <button
            type="button"
            onClick={() => setDocPendingDelete(null)}
            className="w-full sm:flex-1 px-5 py-2.5 sm:py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer text-xs sm:text-sm"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => handleDelete(docPendingDelete)}
            className="w-full sm:flex-1 px-5 py-2.5 sm:py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition cursor-pointer text-xs sm:text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const readinessScore =
    analysisResult.length > 0
      ? Math.round((analysisResult.filter((item) => item.found).length / analysisResult.length) * 100)
      : 0;

  const filteredHistory =
    activeFilter === "All" ? history : history.filter((item) => item.documentType === activeFilter);

  return (
    <MainLayout>
      {deleteDialog}

      <div className="max-w-7xl mx-auto py-2 sm:py-4 transition-all duration-300">

        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-800 dark:text-slate-50 tracking-tight flex items-center gap-2">
            📄 PDF Intelligence Manager
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 text-xs sm:text-base">
            Upload, analyze, and optimize your business, legal, research, and career documents using AI.
          </p>
        </div>

        {/* Quick Action Pills with < > Navigation Arrows */}
        <div className="relative flex items-center gap-1.5 mb-6 sm:mb-8 pb-2.5 border-b border-gray-100 dark:border-slate-800/80">
          {/* Scroll Left < Arrow */}
          <button
            type="button"
            onClick={() => scrollFilters("left")}
            disabled={!canScrollLeft}
            aria-label="Scroll options left"
            title="Scroll options left"
            className={`shrink-0 w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
              canScrollLeft
                ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-xs cursor-pointer active:scale-95"
                : "opacity-25 border-transparent text-slate-400 dark:text-slate-600 cursor-not-allowed pointer-events-none"
            }`}
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>

          {/* Horizontally scrollable filter pills */}
          <div
            ref={filtersScrollRef}
            onScroll={checkFilterScroll}
            className="flex-1 flex gap-2 overflow-x-auto scrollbar-none no-scrollbar scroll-smooth py-0.5"
          >
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={`px-3.5 sm:px-4 py-2 text-xs font-bold rounded-2xl border transition cursor-pointer whitespace-nowrap shrink-0 ${
                  activeFilter === filter.value
                    ? "bg-indigo-500/15 dark:bg-indigo-500/20 border-indigo-500 text-indigo-600 dark:text-indigo-400 glow-active"
                    : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Scroll Right > Arrow */}
          <button
            type="button"
            onClick={() => scrollFilters("right")}
            disabled={!canScrollRight}
            aria-label="Scroll options right"
            title="Scroll options right"
            className={`shrink-0 w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
              canScrollRight
                ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-xs cursor-pointer active:scale-95"
                : "opacity-25 border-transparent text-slate-400 dark:text-slate-600 cursor-not-allowed pointer-events-none"
            }`}
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Main 2-Column Split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">

          {/* Left Column (7/12 width) - Upload zone & Type Selector */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">

            {/* Interactive File Upload card */}
            <div ref={uploadZoneRef} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl sm:rounded-[32px] p-4 sm:p-6 md:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">
                    Upload Document
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Drag and drop or test with official pre-verified sample PDFs
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDemoModal(!showDemoModal)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer self-start sm:self-auto shadow-xs"
                >
                  <FlaskConical size={14} />
                  <span>{showDemoModal ? "Hide Sample Proofs" : "🧪 Try Sample Proof PDFs (11)"}</span>
                </button>
              </div>

              {/* Sample Proofs Tray */}
              {showDemoModal && (
                <div className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        11 Official Test PDFs Ready for Proof & Demonstration
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Click "Load" to instantly test live in AI analyzer, or download the PDF file directly.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                    {SAMPLE_DEMO_PDFS.map((sample) => (
                      <div
                        key={sample.fileName}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="text-base shrink-0">{sample.emoji}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {sample.label}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                              {sample.type}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => loadDemoSamplePDF(sample)}
                            disabled={loadingSampleFile === sample.fileName || isUploading}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                            title="Load and analyze this document"
                          >
                            {loadingSampleFile === sample.fileName ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <span>Load</span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => downloadSamplePDF(sample.fileName, e)}
                            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Download PDF file"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-center transition-all ${
                  dragActive
                    ? "border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20"
                    : "border-gray-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
                }`}
              >
                <label htmlFor="pdf-upload" className="sr-only">
                  Choose a PDF document to upload
                </label>

                <input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handlePDFUpload(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />

                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-sm">
                  {isUploading ? (
                    <Loader2 className="text-indigo-600 dark:text-indigo-400 animate-spin" size={24} />
                  ) : (
                    <Upload className="text-indigo-600 dark:text-indigo-400" size={24} />
                  )}
                </div>

                 <p className="font-bold text-slate-700 dark:text-slate-200 text-xs sm:text-sm">
                   {isUploading
                     ? "Uploading document..."
                     : (<>Drag & drop your PDF file here, or <span className="text-indigo-600 dark:text-indigo-400 hover:underline">browse files</span></>)}
                 </p>
                 <p className="text-[11px] sm:text-xs text-[#9CA3AF] dark:text-slate-400 mt-1.5 sm:mt-2 font-semibold">
                   Only PDF files up to 10MB are supported
                 </p>
              </div>

              {/* Document Type tagging & Presets */}
              <div className="mt-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                      Document Category & Preset Type
                    </label>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Choose a category to apply specialized AI review criteria
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 self-start sm:self-auto shrink-0 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    Active: <span className="font-extrabold text-slate-800 dark:text-slate-100">{tagSelection}</span>
                  </div>
                </div>

                {/* Category Navigation Tabs */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  {PRESET_GROUPS.map((group) => {
                    const isTabActive = selectedCategory === group.category;
                    const hasSelectedPreset = group.items.some((item) => item.id === tagSelection);
                    return (
                      <button
                        key={group.category}
                        type="button"
                        onClick={() => setSelectedCategory(group.category)}
                        className={`relative flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isTabActive
                            ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-800 scale-[1.01]"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-850/50"
                        }`}
                      >
                        <span className="text-sm shrink-0">{group.icon}</span>
                        <span className="truncate hidden sm:inline">{group.category}</span>
                        <span className="truncate sm:hidden">{group.category.split(" ")[0]}</span>
                        {hasSelectedPreset && !isTabActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 absolute top-2 right-2"></span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Preset Options Grid for Selected Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PRESET_GROUPS.find((g) => g.category === selectedCategory)?.items.map((item) => {
                    const isSelected = tagSelection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTagSelection(item.id)}
                        className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                          isSelected
                            ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-600 dark:border-indigo-500 shadow-sm ring-1 ring-indigo-500/20"
                            : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 hover:bg-slate-50/60 dark:hover:bg-slate-850/60"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border transition-all ${
                              isSelected
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                : "bg-slate-100 dark:bg-slate-800 border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 group-hover:scale-105"
                            }`}
                          >
                            {item.emoji}
                          </div>
                          <div className="min-w-0">
                            <p
                              className={`text-xs sm:text-sm font-bold truncate ${
                                isSelected
                                  ? "text-indigo-600 dark:text-indigo-400"
                                  : "text-slate-800 dark:text-slate-100"
                              }`}
                            >
                              {item.label}
                            </p>
                            <p
                              className={`text-[11px] truncate mt-0.5 ${
                                isSelected
                                  ? "text-indigo-600/80 dark:text-indigo-300/80 font-medium"
                                  : "text-slate-400 dark:text-slate-500"
                              }`}
                            >
                              {item.desc}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 pl-1">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700 group-hover:border-slate-400 dark:group-hover:border-slate-600 transition" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* File details review */}
              {selectedFile && (
                <div className="mt-6 bg-slate-50 dark:bg-slate-800 border border-transparent dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
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
                disabled={!selectedFile || isAnalyzing || isUploading}
                className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-6 py-4 rounded-2xl shadow-lg hover:shadow-indigo-500/20 transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
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
            <div className="glass-premium rounded-2xl sm:rounded-[32px] p-4 sm:p-6 md:p-8 shadow-sm flex flex-col justify-between h-full flex-grow min-h-[420px] sm:min-h-[460px]">

              {isAnalyzing ? (
                <div className="flex flex-col justify-between h-full flex-1 animate-pulse space-y-5 py-2">
                  {/* Skeleton Header */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="h-5 w-28 bg-indigo-200/60 dark:bg-indigo-900/40 rounded-full" />
                      <div className="h-6 w-44 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                      <div className="h-3 w-32 bg-slate-100 dark:bg-slate-850 rounded-lg" />
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-100/70 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-center">
                        <Sparkles className="text-indigo-600 dark:text-indigo-400 animate-spin" size={20} />
                      </div>
                      <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                  </div>

                  {/* Skeleton Tab Bar */}
                  <div className="flex gap-4 border-b border-gray-100 dark:border-slate-800 pb-2">
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="h-4 w-16 bg-slate-100 dark:bg-slate-850 rounded-md" />
                    <div className="h-4 w-20 bg-slate-100 dark:bg-slate-850 rounded-md" />
                    <div className="h-4 w-16 bg-slate-100 dark:bg-slate-850 rounded-md" />
                  </div>

                  {/* Skeleton Checklist & Body Items */}
                  <div className="space-y-2.5 flex-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50"
                      >
                        <div className="flex items-center gap-2.5 flex-1">
                          <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                          <div
                            className="h-3.5 bg-slate-300 dark:bg-slate-700 rounded-md"
                            style={{ width: `${55 + (i * 9) % 35}%` }}
                          />
                        </div>
                        <div className="h-4 w-14 bg-indigo-200/60 dark:bg-indigo-950/60 rounded-full" />
                      </div>
                    ))}
                  </div>

                  {/* Live Status Badge */}
                  <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      Gemini AI auditing document rubrics & compliance...
                    </span>
                  </div>
                </div>
              ) : analysisResult.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center flex-1">
                  <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl mb-4 border border-transparent dark:border-slate-800">
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
                        <h3 className="font-extrabold text-slate-800 dark:text-slate-50 text-lg mt-2">
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
                            : "text-gray-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
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
                            : "text-gray-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
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
                            : "text-gray-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                        }`}
                      >
                        Improvement Tips
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("ask")}
                        className={`font-bold transition pb-1 flex items-center gap-1.5 ${
                          activeTab === "ask"
                            ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500"
                            : "text-gray-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                        }`}
                      >
                        <MessageSquare size={13} />
                        <span>Ask AI</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      </button>
                    </div>

                    {/* Tab contents */}
                    {activeTab === "overview" && (
                      <div className="space-y-4">
                        <div className="bg-slate-50/50 dark:bg-slate-800 border border-transparent dark:border-slate-800 rounded-2xl p-4">
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

                        {aiSummary && (
                          <div className="bg-slate-50/50 dark:bg-slate-800 border border-transparent dark:border-slate-800 rounded-2xl p-4">
                            <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                              AI Executive Summary
                            </h4>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                              {aiSummary}
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-50/50 dark:bg-slate-800 border border-transparent dark:border-slate-800 rounded-2xl p-4 text-center">
                            <span className="text-xs text-gray-400 block">Structure</span>
                            <p className="font-bold mt-1 text-sm">
                              {readinessScore >= 80 ? "🟢 Excellent" : readinessScore >= 50 ? "🟡 Good" : "🔴 Poor"}
                            </p>
                          </div>
                          <div className="bg-slate-50/50 dark:bg-slate-800 border border-transparent dark:border-slate-800 rounded-2xl p-4 text-center">
                            <span className="text-xs text-gray-400 block">Verification</span>
                            <p className="font-bold mt-1 text-sm">
                              {analysisResult.filter((item) => item.found).length} / {analysisResult.length} Passed
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "insights" && (
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                        <div className="space-y-2.5">
                          <h4 className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                            Structural Checklist
                          </h4>
                          {analysisResult.map((item) => (
                            <div
                              key={item.title}
                              className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-800 border border-transparent dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs"
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

                        {aiInsights.length > 0 && (
                          <div className="space-y-2 border-t border-gray-100 dark:border-slate-800/80 pt-3">
                            <h4 className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                              Qualitative AI Insights
                            </h4>
                            {aiInsights.map((insight, idx) => (
                              <div
                                key={idx}
                                className="bg-indigo-50/30 dark:bg-indigo-950/15 border border-indigo-100/10 dark:border-indigo-900/30 rounded-xl p-3 text-xs text-indigo-800 dark:text-indigo-300"
                              >
                                💡 {insight}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "tips" && (
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                            Missing Sections
                          </h4>
                          {analysisResult.filter((item) => !item.found).length === 0 ? (
                            <div className="text-center py-4 bg-slate-50/50 dark:bg-slate-800 rounded-2xl border border-transparent dark:border-slate-800">
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

                        {aiTips.length > 0 && (
                          <div className="space-y-2 border-t border-gray-100 dark:border-slate-800/80 pt-3">
                            <h4 className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                              Actionable Recommendations
                            </h4>
                            {aiTips.map((tip, idx) => (
                              <div
                                key={idx}
                                className="bg-amber-50/30 dark:bg-amber-950/15 border border-amber-100/10 dark:border-amber-900/30 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300"
                              >
                                🎯 {tip}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "ask" && (
                      <div className="flex flex-col h-[340px] sm:h-[370px]">
                        {/* Messages Thread */}
                        <div
                          ref={chatScrollRef}
                          className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin pb-2"
                        >
                          {chatMessages.map((msg, mIdx) => (
                            <div
                              key={mIdx}
                              className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                              {msg.role === "assistant" && (
                                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs shadow-xs">
                                  🐼
                                </div>
                              )}
                              <div
                                className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                                  msg.role === "user"
                                    ? "bg-indigo-600 text-white font-medium rounded-br-xs shadow-xs"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50 rounded-bl-xs whitespace-pre-line"
                                }`}
                              >
                                {msg.text}
                              </div>
                            </div>
                          ))}

                          {isAskingAI && (
                            <div className="flex gap-2.5 justify-start items-center">
                              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs animate-pulse">
                                🐼
                              </div>
                              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <Loader2 size={13} className="animate-spin text-indigo-500" />
                                Cross-referencing document text...
                              </div>
                            </div>
                          )}

                          {chatMessages.length <= 1 && (
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                Suggested Quick Questions:
                              </p>
                              <div className="flex flex-col gap-1.5">
                                {[
                                  "What are the primary obligations & deliverables?",
                                  "Are there any risks, penalties, or compliance red flags?",
                                  "Summarize the key takeaways in 3 bullet points",
                                ].map((prompt, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => handleSendQuestion(prompt)}
                                    disabled={isAskingAI}
                                    className="p-2 text-left text-xs bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/80 dark:hover:bg-indigo-950/40 border border-slate-200/70 dark:border-slate-700/60 rounded-xl text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer flex items-center justify-between group"
                                  >
                                    <span className="truncate">{prompt}</span>
                                    <span className="text-indigo-500 opacity-0 group-hover:opacity-100 transition shrink-0 ml-1">➔</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Question Input Form */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSendQuestion();
                          }}
                          className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2"
                        >
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder={`Ask anything about this ${documentType || "document"}...`}
                            disabled={isAskingAI}
                            className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition"
                          />
                          <button
                            type="submit"
                            disabled={!chatInput.trim() || isAskingAI}
                            className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition cursor-pointer shadow-xs shrink-0"
                            title="Send Question"
                          >
                            <Send size={14} />
                          </button>
                        </form>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={downloadReport}
                    className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3.5 rounded-2xl transition cursor-pointer text-xs flex items-center justify-center gap-2 shadow-sm"
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
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 border-b border-gray-100 dark:border-slate-800 pb-2 mb-6">
              AI Document Toolkits
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-200">
                <span className="text-3xl mb-3 block">🎯</span>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">ATS & Career Auditor</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Extracts semantic tokens from resumes, CVs, and portfolios to score ATS suitability, skills density, and role alignment.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-200">
                <span className="text-3xl mb-3 block">📜</span>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Contract & Legal Scanner</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Evaluates contracts, agreements, and invoices for payment terms, confidentiality (NDA), liability clauses, and deadlines.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-200">
                <span className="text-3xl mb-3 block">📊</span>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Academic & Business Auditor</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Checks proposals, research papers, and assignments for problem statements, methodology, data metrics, and citations.
                </p>
              </div>
            </div>
          </div>

          {/* History table list */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl sm:rounded-[32px] p-4 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 sm:mb-5">
              Recent Analyzed Documents
            </h3>

            {historyLoading ? (
              <div className="space-y-3 py-2 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 gap-3"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0" />
                      <div className="space-y-1.5 flex-1 max-w-xs">
                        <div
                          className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded-md"
                          style={{ width: `${55 + (i * 12) % 35}%` }}
                        />
                        <div className="h-2.5 w-24 bg-slate-100 dark:bg-slate-700/60 rounded" />
                      </div>
                    </div>
                    <div className="hidden sm:block h-6 w-24 bg-indigo-100/70 dark:bg-indigo-950/60 rounded-full" />
                    <div className="hidden md:block h-3 w-16 bg-slate-200 dark:bg-slate-700/60 rounded" />
                    <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700/60 rounded-xl" />
                    <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700/60 shrink-0" />
                  </div>
                ))}
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-10 sm:py-12">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl mb-3 sm:mb-4 border border-transparent dark:border-slate-800">
                  📭
                </div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base">
                  {history.length === 0 ? "No documents uploaded yet." : "No documents match this filter."}
                </h4>
                <p className="text-gray-500 dark:text-slate-400 text-xs mt-1.5 sm:mt-2 max-w-xs leading-relaxed">
                  {history.length === 0
                    ? "Upload your first PDF above to start tracking your document history."
                    : "Try selecting a different document type filter."}
                </p>
                {history.length === 0 && (
                  <button
                    type="button"
                    onClick={() => uploadZoneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                    className="mt-4 sm:mt-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl transition cursor-pointer text-xs shadow-sm"
                  >
                    Upload PDF
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto -mx-1 sm:mx-0">
                <table className="w-full text-left text-xs border-collapse min-w-[540px]">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 uppercase font-extrabold tracking-wider">
                      <th className="pb-3.5 pl-2">Name</th>
                      <th className="pb-3.5">Doc Type</th>
                      <th className="pb-3.5">Size</th>
                      <th className="pb-3.5">Status</th>
                      <th className="pb-3.5">Date</th>
                      <th className="pb-3.5 pr-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-300">
                    {filteredHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3.5 pl-2 font-bold text-slate-800 dark:text-slate-100 max-w-xs truncate">
                          {item.fileName}
                        </td>
                        <td className="py-3.5">
                          <span className="bg-slate-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800 px-2 py-0.5 rounded-lg text-[10px]">
                            {item.documentType}
                          </span>
                        </td>
                        <td className="py-3.5 text-gray-400">{formatFileSize(item.fileSize)}</td>
                        <td className="py-3.5">
                          {item.readinessScore !== undefined && item.readinessScore !== null ? (
                            <span className={`font-black ${item.readinessScore >= 80 ? "text-green-600" : "text-yellow-600"}`}>
                              {item.readinessScore}%
                            </span>
                          ) : (
                            <span className="text-gray-400 font-semibold">Not analyzed</span>
                          )}
                        </td>
                        <td className="py-3.5 text-gray-400">{formatDate(item.uploadedAt)}</td>
                        <td className="py-3.5 pr-2">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              title="Delete document"
                              aria-label={`Delete ${item.fileName}`}
                              disabled={deletingId === item.id}
                              onClick={() => setDocPendingDelete(item)}
                              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                            >
                              {deletingId === item.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </MainLayout>
  );
}

export default PDFManager;
