import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDirs = [
  path.resolve(__dirname, "../../sample_test_pdfs"),
  path.resolve(__dirname, "../public/sample_test_pdfs"),
];

for (const dir of targetDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const SAMPLES = [
  {
    fileName: "01_Contract_Agreement_Sample.pdf",
    category: "Professional & Business",
    type: "Contract / Agreement",
    title: "MASTER SERVICES AGREEMENT & NON-DISCLOSURE (MSA)",
    subtitle: "Binding Legal Terms, Service Scope & Obligations",
    sections: [
      {
        heading: "1. PARTIES & EFFECTIVE DATE",
        text: "This Master Services Agreement ('Agreement' or 'Contract') is entered into and made effective as of September 25, 2026 ('Effective Date'), by and between TaskPanda Technologies Inc., a Delaware corporation with offices at 100 Innovation Way, Suite 400 ('Company'), and Acme Global Solutions LLC, with offices at 500 Market Street ('Client'). The Company and Client are collectively referred to as the 'Parties' and individually as a 'Party'.",
      },
      {
        heading: "2. SCOPE OF WORK & OBLIGATIONS",
        text: "The Company agrees to provide enterprise document management, intelligent AI workflow automation, and custom cloud development services as described in mutually executed Statements of Work (SOW). Client agrees to deliver timely technical specifications, user credentials, and necessary architectural review feedback within 5 business days of request.",
      },
      {
        heading: "3. PAYMENT TERMS & INVOICING",
        text: "Client shall pay all undisputed invoiced fees within thirty (30) days from the invoice date (Net 30). Late payments shall accrue interest at the lesser of one and one-half percent (1.5%) per month or the maximum rate permitted by governing law. All fees are exclusive of applicable federal, state, or local taxes.",
      },
      {
        heading: "4. CONFIDENTIALITY & NON-DISCLOSURE (NDA)",
        text: "Each Party agrees that all business, technical, financial, and product data disclosed under this Agreement shall remain strictly confidential. The Receiving Party shall protect such information using the same degree of care it uses for its own confidential data, but not less than reasonable care. Obligations survive for five (5) years following termination.",
      },
      {
        heading: "5. TERM AND TERMINATION CLAUSES",
        text: "This Agreement shall commence on the Effective Date and remain in force for an initial term of twelve (12) months. Either Party may terminate this Agreement immediately upon written notice if the other Party materially breaches any term and fails to cure such breach within thirty (30) days of receiving formal notice.",
      },
      {
        heading: "6. GOVERNING LAW & JURISDICTION",
        text: "These terms and conditions and any dispute arising out of or related to this Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to conflicts of law provisions.",
      },
    ],
  },
  {
    fileName: "02_Business_Proposal_Sample.pdf",
    category: "Professional & Business",
    type: "Business Proposal",
    title: "BUSINESS PROPOSAL: ENTERPRISE WORKFLOW AUTOMATION",
    subtitle: "AI-Powered Productivity Platform Modernization",
    sections: [
      {
        heading: "1. EXECUTIVE SUMMARY",
        text: "This business proposal outlines our strategic partnership to deploy TaskPanda AI across your enterprise organization. By automating repetitive document reviews, team sprint scheduling, and compliance verification, our solution projects a 40% reduction in operational cycle times within the first quarter of deployment.",
      },
      {
        heading: "2. PROBLEM STATEMENT & PROPOSED SOLUTION",
        text: "Modern engineering teams spend over 14 hours per week searching through unstructured PDF specifications, project reports, and contract amendments. Our proposed solution integrates multi-agent AI verification with real-time Firebase collaboration, turning static documents into actionable tasks and interactive checklists.",
      },
      {
        heading: "3. SCOPE OF WORK & KEY DELIVERABLES",
        text: "Phase 1: Architecture audit & security clearance (Weeks 1-3). Deliverable: Approved threat model.\nPhase 2: Core PDF Intelligence Manager & AI assistant integration (Weeks 4-7). Deliverable: Working beta deployment.\nPhase 3: Team workspaces, gamified incentives & enterprise SSO rollout (Weeks 8-12). Deliverable: Full production release.",
      },
      {
        heading: "4. PROJECT BUDGET & PRICING BREAKDOWN",
        text: "The total project budget is $45,000 USD, structured across three milestone payments:\n• Milestone 1 (Discovery & Architecture): $15,000\n• Milestone 2 (Core Development & AI Engine): $20,000\n• Milestone 3 (Enterprise Deployment & Training): $10,000\nOngoing monthly cloud hosting and SLA support: $1,200/month.",
      },
      {
        heading: "5. TIMELINE & MILESTONES",
        text: "Project kickoff commences October 1, 2026. Weekly sprint reviews and progress demos will ensure transparent deliverables. Final user acceptance testing (UAT) and company-wide onboarding are scheduled for completion by December 18, 2026.",
      },
    ],
  },
  {
    fileName: "03_Invoice_Receipt_Sample.pdf",
    category: "Professional & Business",
    type: "Invoice / Receipt",
    title: "TAX INVOICE & OFFICIAL PAYMENT RECEIPT",
    subtitle: "Invoice Number: INV-2026-0842 | Date: September 25, 2026",
    sections: [
      {
        heading: "1. VENDOR & CUSTOMER DETAILS",
        text: "VENDOR:\nTaskPanda Technologies Inc.\n100 Innovation Way, Suite 400, Wilmington, DE\nTax ID / EIN: 88-3920194 | billing@taskpanda.io\n\nCUSTOMER / BILLED TO:\nApex Global Logistics Ltd.\n450 Harbor Boulevard, Suite 120, Boston, MA\nContact: billing@apexlogistics.com",
      },
      {
        heading: "2. ITEMIZED LINE ITEMS & DESCRIPTION",
        text: "Item 1: Enterprise AI Document Intelligence Engine (Annual License) — $2,500.00\nItem 2: Custom Cloud Hosting & Dedicated Firebase Sharding Setup — $1,200.00\nItem 3: Staff Training Workshop & Integration Consulting (10 Hours) — $500.00\nItem 4: Priority 24/7 Security Patching & Maintenance Support — $300.00",
      },
      {
        heading: "3. SUBTOTAL, TAXES & TOTAL AMOUNT DUE",
        text: "Subtotal: $4,500.00\nDiscounts (Early Adopter Credit 10%): -$450.00\nNet Subtotal: $4,050.00\nSales Tax / VAT (8.25%): $334.13\nTotal Amount Due: $4,384.13",
      },
      {
        heading: "4. PAYMENT TERMS & INSTRUCTIONS",
        text: "Payment Terms: Net 15 Days. Please remit payment via Automated Clearing House (ACH), Wire Transfer, or Corporate Card. For wire instructions, reference Invoice #INV-2026-0842. Thank you for your business!",
      },
    ],
  },
  {
    fileName: "04_Meeting_Minutes_Sample.pdf",
    category: "Professional & Business",
    type: "Meeting Minutes",
    title: "EXECUTIVE SPRINT PLANNING MEETING MINUTES",
    subtitle: "Product Architecture & AI Engine Sync | September 25, 2026",
    sections: [
      {
        heading: "1. MEETING DATE & ATTENDEES",
        text: "Date: Friday, September 25, 2026 | Time: 10:00 AM - 11:30 AM EST\nLocation: Virtual Boardroom (TaskPanda Teams Conference)\n\nAttendees:\n• Dr. Sarah Chen (Chief Technology Officer - Chair)\n• Marcus Vance (VP of Product Engineering)\n• Priya Sharma (Lead Architect)\n• David Miller (QA & Compliance Director)\n• Elena Rostova (Lead UI/UX Designer)",
      },
      {
        heading: "2. AGENDA TOPICS",
        text: "1. Review of Q3 PDF Manager roll-out and document intelligence speed.\n2. Assessment of 11 domain presets and custom analysis prompts.\n3. Resolving horizontal filter scroll usability and desktop arrow navigation.\n4. Firestore indexing and storage security rules verification.",
      },
      {
        heading: "3. KEY DECISIONS & FORMAL APPROVALS",
        text: "Decision 1: Approved the rollout of all 11 document presets (Contracts, Proposals, Invoices, Meeting Minutes, Research Papers, Study Notes, Resumes, Assignments, Project Reports, Internship Reports, General Documents).\nDecision 2: Approved replacement of solid purple scrollbar with subtle styling and interactive navigation arrows.\nDecision 3: Approved 10MB maximum PDF size restriction for stability.",
      },
      {
        heading: "4. ACTION ITEMS & ASSIGNEES",
        text: "• Action Item 1: Priya Sharma to benchmark Gemini 2.5 Flash token latency (Due: Sep 28).\n• Action Item 2: Elena Rostova to deliver dark/light theme vector assets (Due: Sep 29).\n• Action Item 3: David Miller to execute automated end-to-end regression suites (Due: Oct 01).\n• Action Item 4: Marcus Vance to prepare external client release notes (Due: Oct 02).",
      },
      {
        heading: "5. NEXT MEETING SCHEDULE",
        text: "The next bi-weekly Sprint Retrospective meeting is scheduled for Friday, October 9, 2026, at 10:00 AM EST.",
      },
    ],
  },
  {
    fileName: "05_Research_Paper_Sample.pdf",
    category: "Academic & Research",
    type: "Research Paper",
    title: "RESEARCH PAPER: EVALUATING LLM-DRIVEN DOCUMENT INTELLIGENCE",
    subtitle: "Latency, Precision & Domain Verification in Autonomous Systems",
    sections: [
      {
        heading: "ABSTRACT",
        text: "Autonomous document evaluation systems powered by Large Language Models (LLMs) represent a significant leap in enterprise automation. This research paper evaluates the performance, categorization accuracy, and token efficiency of domain-tuned prompt architectures versus naive heuristics. In empirical benchmarks spanning 1,200 heterogeneous documents, our specialized preset method achieved a 98.4% classification fidelity and reduced cognitive review overhead by 62%.",
      },
      {
        heading: "1. INTRODUCTION & LITERATURE REVIEW",
        text: "The proliferation of digital documentation in legal, academic, and engineering disciplines has created severe validation bottlenecks (Vaswani et al., 2017). Prior literature emphasizes that general-purpose foundation models frequently omit domain-specific compliance nuances unless structured checklists and contextual prompting are enforced (Brown et al., 2020; Kaplan et al., 2020).",
      },
      {
        heading: "2. METHODOLOGY",
        text: "We deployed a dual-stage pipeline comprising: (1) Client-side text tokenization and metadata extraction via WebAssembly-compiled PDF.js, and (2) Cloud-orchestrated Gemini inference applying structured rubric checklists. Documents were classified across eleven distinct categories, each evaluated against predetermined readiness criteria including structural completeness, risk markers, and actionability.",
      },
      {
        heading: "3. EXPERIMENTAL RESULTS & ANALYSIS",
        text: "Quantitative evaluations demonstrated an average end-to-end analysis latency of 1.42 seconds for 10-page documents. The domain-tailored prompts exhibited a 31% higher defect identification rate in contractual NDA ambiguity compared to baseline zero-shot models. Inter-annotator agreement (Cohen's Kappa) reached 0.91.",
      },
      {
        heading: "4. DISCUSSION & CONCLUSIONS",
        text: "The experimental results demonstrate that pairing client-side keyword heuristics with structured LLM JSON output guarantees reliable document verification while maintaining sub-second user responsiveness. Future work will investigate on-device WebGPU inference.",
      },
      {
        heading: "5. REFERENCES & CITATIONS",
        text: "1. Vaswani, A., et al. (2017). Attention Is All You Need. Advances in Neural Information Processing Systems (NeurIPS).\n2. Brown, T., et al. (2020). Language Models are Few-Shot Learners. NeurIPS 2020.\n3. Kaplan, J., et al. (2020). Scaling Laws for Neural Language Models. arXiv:2001.08361.\n4. Chen, M., et al. (2021). Evaluating Large Language Models Trained on Code. arXiv:2107.03374.",
      },
    ],
  },
  {
    fileName: "06_Study_Notes_Sample.pdf",
    category: "Academic & Research",
    type: "Study Notes",
    title: "STUDY NOTES: ADVANCED DATA STRUCTURES & ALGORITHMS",
    subtitle: "Comprehensive Exam Preparation & Conceptual Review Guide",
    sections: [
      {
        heading: "CHAPTER 4: BALANCED SEARCH TREES & GRAPH ALGORITHMS",
        text: "Course: CS-301 Advanced Algorithms | Semester: Fall 2026 | Prepared by: Department of Computer Science",
      },
      {
        heading: "1. CORE CONCEPTS & DEFINITIONS",
        text: "Definition 1 (AVL Tree): An AVL tree is a strictly self-balancing Binary Search Tree (BST) where the difference between heights of left and right subtrees (Balance Factor) for any node cannot exceed 1.\n\nDefinition 2 (Dynamic Programming): An algorithmic technique that solves complex problems by breaking them into overlapping subproblems and memoizing intermediate solutions to avoid redundant computation.",
      },
      {
        heading: "2. KEY FORMULAS & COMPLEXITY RULES",
        text: "• Balance Factor Formula: BF(Node) = Height(Left_Child) - Height(Right_Child), where BF ∈ {-1, 0, 1}.\n• Tree Height Limit: Height h ≤ 1.44 * log2(n + 2) - 0.328.\n• Master Theorem: T(n) = aT(n/b) + f(n). If f(n) = Θ(n^(log_b(a))), then T(n) = Θ(n^(log_b(a)) * log n).\n• Search, Insertion, Deletion Time Complexity: O(log n) worst-case.",
      },
      {
        heading: "3. ILLUSTRATIVE EXAMPLES & TREE ROTATIONS",
        text: "Case 1 (Left-Left Heavy): Solved with single Right Rotation around the pivot node.\nCase 2 (Left-Right Heavy): Solved with Left Rotation on left child followed by Right Rotation on parent node.\nExample: Graph traversal via Breadth-First Search (BFS) uses a FIFO Queue (O(V+E)), whereas Depth-First Search (DFS) utilizes a LIFO Stack or recursion.",
      },
      {
        heading: "4. CHAPTER SUMMARY",
        text: "Self-balancing binary trees ensure worst-case O(log n) lookup operations, circumventing degenerated O(n) linked-list degradation. Graph shortest-path problems are solved using Dijkstra's algorithm with priority queues in O((V + E) log V).",
      },
      {
        heading: "5. REVIEW QUESTIONS",
        text: "1. Given an AVL tree node with balance factor +2 and child balance factor -1, what composite rotation is required?\n2. Under what condition does Dijkstra's algorithm fail, and what algorithm should be utilized instead? (Hint: Negative edge weights -> Bellman-Ford).",
      },
    ],
  },
  {
    fileName: "07_Resume_Sample.pdf",
    category: "Career & Universal",
    type: "Resume",
    title: "CURRICULUM VITAE - ALEX M. JOHNSON",
    subtitle: "Senior Full-Stack & Cloud Software Engineer",
    sections: [
      {
        heading: "CONTACT INFORMATION",
        text: "Email: alex.johnson.dev@gmail.com | Phone: +1 (555) 782-9301 | Location: San Francisco, CA\nPortfolio: alexjohnson.dev | GitHub: github.com/alex-johnson | LinkedIn: linkedin.com/in/alex-johnson-swe",
      },
      {
        heading: "EDUCATION",
        text: "Bachelor of Science in Computer Science & Engineering\nUniversity of California, Berkeley | GPA: 3.92 / 4.00 (Magna Cum Laude)\nGraduation Date: May 2024\nRelevant Coursework: Distributed Systems, Operating Systems, Machine Learning, Database Architecture.",
      },
      {
        heading: "TECHNICAL SKILLS SUMMARY",
        text: "• Languages: JavaScript (ES6+), TypeScript, Python, Go, C++, SQL, HTML5/CSS3\n• Frontend: React 19, Next.js, Tailwind CSS, Vite, Redux Toolkit, WebSockets\n• Backend & Cloud: Node.js, Express, Google Cloud Platform (GCP), Firebase, Docker, PostgreSQL, Redis\n• AI & Tooling: Gemini API, LangChain, Git, CI/CD GitHub Actions, Jest, Playwright",
      },
      {
        heading: "WORK EXPERIENCE",
        text: "Full-Stack Software Engineer — Nexus Cloud Labs (July 2024 – Present)\n• Designed and scaled real-time collaboration engines supporting over 150,000 active daily enterprise users.\n• Reduced document processing latency by 42% through asynchronous web workers and client-side caching.\n• Implemented automated CI/CD pipelines reducing deployment friction from 2 hours to 8 minutes.\n\nSoftware Engineering Intern — CloudScale Systems (May 2023 – August 2023)\n• Built reusable UI design components in React and Tailwind CSS adopted by 24 engineering teams.\n• Engineered secure Firebase Firestore rules and RESTful microservices processing 1M daily requests.",
      },
      {
        heading: "FEATURED PROJECTS & PORTFOLIO",
        text: "TaskPanda AI: Smart productivity platform with gamified companions and AI document inspection.\nAlgoVisualizer: Interactive web tool for graph algorithms with 3,500+ monthly active developers.",
      },
      {
        heading: "CERTIFICATIONS",
        text: "• AWS Certified Solutions Architect – Associate (2025)\n• Google Cloud Certified Professional Cloud Developer (2025)",
      },
    ],
  },
  {
    fileName: "08_Assignment_Sample.pdf",
    category: "Academic & Research",
    type: "Assignment",
    title: "COURSEWORK ASSIGNMENT: MACHINE LEARNING & NEURAL NETWORKS",
    subtitle: "Course: CS-480 Deep Learning | Assignment 3: Optimization Analysis",
    sections: [
      {
        heading: "1. INTRODUCTION & PROBLEM CONTEXT",
        text: "Introduction: Training deep multi-layer neural networks involves navigating highly non-convex loss surfaces subject to vanishing gradients and local saddle points. This assignment investigates the empirical convergence rates of Stochastic Gradient Descent (SGD) with Momentum versus adaptive learning rate algorithms (Adam and RMSProp) across image recognition benchmarks.",
      },
      {
        heading: "2. CORE OBJECTIVES & EXPERIMENTAL SETUP",
        text: "The primary objectives are:\n1. Implement a 5-layer Convolutional Neural Network (CNN) from first principles.\n2. Evaluate learning rate schedules (Cosine Annealing vs Step Decay).\n3. Measure the regularization efficacy of Dropout (p=0.3) against L2 weight decay.",
      },
      {
        heading: "3. DISCUSSION & FINDINGS",
        text: "Experimental trials were conducted over 100 training epochs on standardized datasets. Key findings indicate:\n• Adam optimizer achieved 94.2% test accuracy within 30 epochs, demonstrating rapid initial parameter adaptation.\n• SGD with Nesterov momentum (mu=0.9) required 75 epochs but reached a marginally superior final test accuracy of 95.1% with lower generalization error.\n• Incorporating batch normalization before ReLU activations eliminated internal covariate shift and reduced gradient variance by 58%.",
      },
      {
        heading: "4. CONCLUSION SUMMARY",
        text: "In conclusion, adaptive optimizers like Adam provide superior exploratory trajectories in early training epochs, whereas momentum-based SGD excels in fine-grained convergence during later training stages. Hybrid scheduling yields the optimal balance between speed and precision.",
      },
      {
        heading: "5. BIBLIOGRAPHY & REFERENCES",
        text: "1. Goodfellow, I., Bengio, Y., & Courville, A. (2016). Deep Learning. MIT Press.\n2. Kingma, D. P., & Ba, J. (2014). Adam: A Method for Stochastic Optimization. arXiv:1412.6980.\n3. He, K., Zhang, X., Ren, S., & Sun, J. (2016). Deep Residual Learning for Image Recognition. CVPR 2016.",
      },
    ],
  },
  {
    fileName: "09_Project_Report_Sample.pdf",
    category: "Academic & Research",
    type: "Project Report",
    title: "ENGINEERING CAPSTONE PROJECT REPORT: TASKPANDA AI",
    subtitle: "Intelligent Productivity Suite with Gamified AI Companion Engine",
    sections: [
      {
        heading: "1. PROBLEM STATEMENT",
        text: "Modern knowledge workers and university students suffer from severe digital fragmentation, juggling separate applications for task management, team collaboration, document inspection, and motivation. This cognitive dissonance leads to estimated productivity losses exceeding 25%. There exists a critical need for an integrated ecosystem harmonizing task orchestration, AI analysis, and gamified reinforcement.",
      },
      {
        heading: "2. RESEARCH OBJECTIVES",
        text: "The objectives of this capstone project are:\n1. Construct a responsive, accessible single-page web architecture using React 19 and Tailwind CSS.\n2. Integrate Google Gemini AI to provide real-time document quality audits across 11 standard formats.\n3. Implement Firestore real-time data sync with granular role-based access controls for teams.\n4. Design a gamified virtual panda companion that awards XP and badges upon task completion.",
      },
      {
        heading: "3. METHODOLOGY & SYSTEM ARCHITECTURE",
        text: "The system adopts a modular micro-frontend architecture backed by Node.js and Google Cloud Functions. Documents uploaded via PDF.js are parsed on the client to extract text and structure without exposing confidential payloads. The processed corpus is forwarded to domain-specialized prompt templates executing structured rubric scoring.",
      },
      {
        heading: "4. IMPLEMENTATION WALKTHROUGH",
        text: "Key engineering modules include:\n• PDF Intelligence Manager: Parses multi-page PDF documents, auto-detects 11 document types, and presents interactive checklists.\n• Team Collaboration Hub: Features real-time task assignment, member roles, and AI assignee recommendations.\n• Gamification Engine: Tracks user streaks, levels up the panda companion, and awards milestone badges.",
      },
      {
        heading: "5. TESTING METRICS & VALIDATION",
        text: "The application was subjected to automated Playwright end-to-end testing and manual user audits:\n• System uptime: 99.9% over 30 days of testing.\n• Average document analysis speed: 1.68 seconds.\n• Test coverage: 88% statement coverage across critical business logic modules.",
      },
      {
        heading: "6. FUTURE SCOPE & LIMITATIONS",
        text: "Future scope includes optical character recognition (OCR) support for photographed paper notes, multi-language localization, and offline PWA functionality.",
      },
    ],
  },
  {
    fileName: "10_Internship_Report_Sample.pdf",
    category: "Career & Universal",
    type: "Internship Report",
    title: "FINAL INTERNSHIP REPORT: SOFTWARE ENGINEERING",
    subtitle: "12-Week Industry Internship at CloudScale Technologies Inc.",
    sections: [
      {
        heading: "1. COMPANY PROFILE & HOST ORGANIZATION",
        text: "Company: CloudScale Technologies Inc.\nHeadquarters: Silicon Valley, CA | Sector: Cloud Observability & Developer Tools\nSupervisor: Marcus Vance (Senior Director of Engineering)\nDuration: June 1, 2026 – August 21, 2026 (12 Weeks)\n\nCloudScale Technologies provides cloud performance analytics and automated log monitoring infrastructure for Fortune 500 enterprises.",
      },
      {
        heading: "2. LOG OF WORK DONE & ASSIGNED DUTIES",
        text: "During the 12-week software engineering internship, work done included:\n• Weeks 1-3: Completed onboarding, environment configuration, and codebase orientation. Resolved 8 backlog UI issues.\n• Weeks 4-7: Designed and developed the PDF Intelligence document parsing microservice. Created client-side progress loaders and error boundary handlers.\n• Weeks 8-10: Integrated Firebase authentication, cloud Firestore data models, and team collaboration invitations.\n• Weeks 11-12: Conducted performance optimizations, reduced bundle size by 28%, and documented API endpoints.",
      },
      {
        heading: "3. TECHNOLOGIES & TOOLINGS UTILIZED",
        text: "• Frontend: React 19, JavaScript (ES2024), Tailwind CSS, Vite, HTML5 Canvas\n• Backend: Node.js, Express, Firebase Firestore & Cloud Storage, Google Gemini REST API\n• Tooling: Git, GitHub Actions, Docker, ESLint, Playwright, Vercel Platform",
      },
      {
        heading: "4. LEARNING MILESTONES & PROFESSIONAL GROWTH",
        text: "The internship enabled mastery of agile software development methodologies (Scrum), sprint retrospectives, and enterprise code review protocols. I gained hands-on experience in building fault-tolerant user interfaces and implementing strict security guidelines for user document data.",
      },
      {
        heading: "5. REPORT CONCLUSION & ACKNOWLEDGMENTS",
        text: "In conclusion, the internship experience bridged the gap between academic computer science theory and production-grade software engineering. I express sincere gratitude to my mentor Marcus Vance and the CloudScale engineering team for their mentorship.",
      },
    ],
  },
  {
    fileName: "11_General_Document_Sample.pdf",
    category: "Career & Universal",
    type: "General Document",
    title: "ORGANIZATIONAL POLICY: DATA GOVERNANCE & AI USAGE",
    subtitle: "Standard Operating Procedures (SOP) & Compliance Guidelines",
    sections: [
      {
        heading: "1. DOCUMENT TITLE & OVERVIEW",
        text: "Document Title: Standard Operating Procedures for Enterprise Data Governance, Information Security, and Responsible AI Utilization.\nDocument Code: SOP-GOV-2026-V2 | Effective Date: September 25, 2026\n\nOverview: This governance document defines standard operating protocols for handling company records, managing confidential digital files, and utilizing generative AI tools safely across all corporate departments.",
      },
      {
        heading: "2. CORE THEMES & OPERATIONAL PRINCIPLES",
        text: "1. Data Integrity: All business documents must be accurately cataloged, tagged with appropriate classification tiers (Public, Internal, Confidential, Restricted), and retained according to regulatory statutory schedules.\n2. Responsible Artificial Intelligence: AI assistance tools must only be used to augment employee productivity. All AI-generated outputs, analyses, and summaries require human review before client delivery.",
      },
      {
        heading: "3. SUPPORTING DATA POINTS & REGULATORY CONTEXT",
        text: "Industry audit reports demonstrate that companies maintaining proactive document governance programs reduce accidental data disclosure incidents by 79% and achieve 3.4x faster compliance audit completion. Furthermore, standardized document templates improve cross-functional collaboration efficiency by 35%.",
      },
      {
        heading: "4. ACTIONABLE TAKEAWAYS FOR EMPLOYEES",
        text: "• Never submit unredacted Personally Identifiable Information (PII) or confidential client keys into public AI prompts.\n• Verify all AI-generated contractual terms, financial numbers, and dates against original source documentation.\n• Store all final executed agreements, invoices, and research reports in secure, backed-up company cloud repositories.",
      },
      {
        heading: "5. SUMMARY & RECOMMENDATIONS",
        text: "Summary: Proactive compliance protects company assets and client confidentiality. Department heads are required to ensure 100% staff completion of annual data security training and maintain formal audit trails for all sensitive documents.",
      },
    ],
  },
];

console.log("Generating 11 sample PDF test documents...");

for (const sample of SAMPLES) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, pageWidth, 28, "F");

  // Accent Line
  doc.setFillColor(99, 102, 241); // Indigo-500
  doc.rect(0, 27, pageWidth, 2, "F");

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("TASKPANDA AI • OFFICIAL TEST DOCUMENT", margin, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text(`Category: ${sample.category}  |  Preset: ${sample.type}`, margin, 18);

  // Document Title
  let cursorY = 38;
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  const titleLines = doc.splitTextToSize(sample.title, contentWidth);
  doc.text(titleLines, margin, cursorY);
  cursorY += titleLines.length * 6 + 2;

  // Subtitle
  doc.setTextColor(79, 70, 229); // Indigo-600
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(sample.subtitle, margin, cursorY);
  cursorY += 6;

  // Horizontal divider
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.4);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 6;

  // Render Sections
  for (const section of sample.sections) {
    // Section Heading
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);

    // Check page overflow
    if (cursorY + 20 > pageHeight - margin) {
      doc.addPage();
      cursorY = margin + 5;
    }

    doc.text(section.heading, margin, cursorY);
    cursorY += 4.5;

    // Section Content
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);

    const textLines = doc.splitTextToSize(section.text, contentWidth);
    for (const line of textLines) {
      if (cursorY + 6 > pageHeight - margin) {
        doc.addPage();
        cursorY = margin + 5;
      }
      doc.text(line, margin, cursorY);
      cursorY += 4.2;
    }
    cursorY += 4.5;
  }

  // Footer on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text(
      `TaskPanda AI Document Verification Sample • ${sample.type}`,
      margin,
      pageHeight - 7
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin - 18,
      pageHeight - 7
    );
  }

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  for (const targetDir of targetDirs) {
    const filePath = path.join(targetDir, sample.fileName);
    fs.writeFileSync(filePath, pdfBuffer);
  }

  console.log(`Generated: ${sample.fileName} (${pdfBuffer.length} bytes)`);
}

console.log("\nAll 11 sample PDFs successfully generated in:");
for (const dir of targetDirs) {
  console.log(` -> ${dir}`);
}
