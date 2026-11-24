import { ScanText, FileSearch, Braces, Tags, Scissors, Search, MessageSquareText, FileText, GitCompare, Workflow, type LucideIcon } from "lucide-react";

export const FEATURE_CARDS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: FileText, title: "AI Document Parsing", text: "Convert PDFs, office files, tables and forms into machine readable content with page level structure." },
  { icon: ScanText, title: "Intelligent OCR", text: "Read scanned PDFs and images so every page becomes searchable text." },
  { icon: Braces, title: "Structured Data Extraction", text: "Define the fields you need and receive validated JSON for every document." },
  { icon: Tags, title: "Document Classification", text: "Sort documents into default or custom categories based on their content." },
  { icon: Scissors, title: "Document Splitting", text: "Detect separate documents inside one file and review boundaries before saving." },
  { icon: Search, title: "AI Document Search", text: "Combine keyword and AI expanded search with filters, tags and excerpts." },
  { icon: MessageSquareText, title: "Document Chat", text: "Ask questions in plain language and receive answers with page citations." },
  { icon: FileSearch, title: "Document Summarization", text: "Generate executive summaries, key dates, parties, obligations and action items." },
  { icon: GitCompare, title: "Document Comparison", text: "Highlight changed terms, missing clauses, conflicts and amount variations." },
  { icon: Workflow, title: "Workflow Automation", text: "Chain classification, extraction, validation, approvals and notifications." },
];

export const PROBLEMS = [
  "Manual document processing", "Unstructured information", "Time consuming data extraction",
  "Scanned documents that cannot be searched", "Disorganized document libraries", "Difficulty finding information across files",
  "Repetitive data entry", "Errors during manual extraction", "Slow document review processes",
];

export const STEPS = [
  { t: "Upload documents or connect a supported data source", d: "Add files individually or in bulk. Cloud storage connectors are designed into the architecture and enabled once configured." },
  { t: "Parse and extract information", d: "DocBridge reads text, tables and scanned pages, then extracts the fields defined in your schemas." },
  { t: "Organize and index document content", d: "Documents are classified, summarized, tagged and indexed by page for retrieval." },
  { t: "Search, analyze, and automate workflows", d: "Ask questions, compare documents and route work through approval workflows." },
];

export const SOLUTIONS = [
  { id: "legal", name: "Legal Firms", challenge: "Contracts arrive in many formats and key terms are buried across long documents.", text: "Extract important clauses, dates, obligations, parties, and other relevant information from contracts and legal documents.", uses: ["Clause and obligation extraction", "Expiration and renewal tracking", "Side by side agreement comparison"] },
  { id: "finance", name: "Financial Services", challenge: "Statements, invoices and supporting reports need consistent data entry and review.", text: "Extract information from financial statements, invoices, reports, and supporting documents.", uses: ["Statement and report parsing", "Invoice field extraction", "Supporting document organization"] },
  { id: "insurance", name: "Insurance Companies", challenge: "Claims files mix forms, correspondence and evidence that must be organized.", text: "Process claims documents, extract policy information, and organize supporting evidence.", uses: ["Claims intake classification", "Policy detail extraction", "Evidence search with citations"] },
  { id: "healthcare", name: "Healthcare Organizations", challenge: "Medical documents are sensitive, varied and hard to search.", text: "Organize medical documents, extract structured information, and search authorized records.", uses: ["Role based record access", "Structured field extraction", "Searchable authorized records"] },
  { id: "hr", name: "Human Resources", challenge: "Resumes, contracts and onboarding records create repetitive manual entry.", text: "Process resumes, employment contracts, employee documents, and onboarding records.", uses: ["Resume field extraction", "Employment contract review", "Onboarding document tracking"] },
  { id: "procurement", name: "Procurement Teams", challenge: "Supplier data lives across purchase orders, contracts and invoices.", text: "Extract supplier information, purchase order details, contract terms, and invoice information.", uses: ["Supplier detail extraction", "Purchase order parsing", "Contract term comparison"] },
  { id: "accounting", name: "Accounting Firms", challenge: "Client documents arrive in bulk and need sorting and data capture.", text: "Process invoices, receipts, financial statements, and tax supporting documents.", uses: ["Bulk receipt processing", "Invoice data capture", "Tax document organization"] },
  { id: "ops", name: "Enterprise Operations", challenge: "Intake, review and approval steps are handled by hand across teams.", text: "Automate document intake, information extraction, classification, and approval workflows.", uses: ["Automated intake routing", "Validation and flagging", "Approval workflows with history"] },
];
