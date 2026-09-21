import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

export const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const DOCUMENT_TYPES = ["Resume", "Assignment", "Project Report", "Internship Report"];

/**
 * Validates that a file is a real PDF under the size limit.
 * Checks both MIME type and extension since drag/drop payloads
 * sometimes arrive with an empty/unreliable `type`.
 */
export function validatePdfFile(file) {
  if (!file) {
    return { valid: false, error: "No file selected." };
  }

  const isPdfType = file.type === "application/pdf";
  const isPdfExtension = file.name?.toLowerCase().endsWith(".pdf");

  if (!isPdfType && !isPdfExtension) {
    return { valid: false, error: "Only PDF files are supported." };
  }

  if (file.size === 0) {
    return { valid: false, error: "The selected file is empty." };
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return { valid: false, error: "PDF files must be 10MB or smaller." };
  }

  return { valid: true, error: null };
}

/**
 * Records an analysed PDF in the `pdfDocuments` collection.
 *
 * The file itself is deliberately not stored. Firebase Storage requires the
 * paid Blaze plan, and the original PDF already lives on the user's own
 * machine — what has lasting value is the analysis. So this keeps the document
 * details and (once analysis finishes) its checklist, score and word count,
 * giving a history of what was checked without needing a file store.
 */
export async function createPdfDocumentRecord({
  file,
  userId,
  documentType,
  pageCount,
  wordCount,
}) {
  if (!userId) throw new Error("You must be signed in to analyse documents.");

  const validation = validatePdfFile(file);
  if (!validation.valid) throw new Error(validation.error);

  const record = {
    userId,
    fileName: file.name,
    fileType: file.type || "application/pdf",
    fileSize: file.size,
    documentType,
    pageCount: pageCount || 0,
    wordCount: wordCount || 0,
    uploadedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "pdfDocuments"), record);

  return { id: docRef.id, ...record, uploadedAt: new Date() };
}

/** Fetches the signed-in user's PDF documents, newest first. */
export async function fetchUserPdfDocuments(userId) {
  if (!userId) return [];

  const q = query(collection(db, "pdfDocuments"), where("userId", "==", userId));
  const snapshot = await getDocs(q);

  const docs = [];
  snapshot.forEach((docSnap) => {
    docs.push({ id: docSnap.id, ...docSnap.data() });
  });

  docs.sort((a, b) => {
    const secondsA = a.uploadedAt?.seconds || 0;
    const secondsB = b.uploadedAt?.seconds || 0;
    return secondsB - secondsA;
  });

  return docs;
}

/**
 * Patches metadata onto an already-uploaded PDF document, used to link
 * the AI analysis results (word count, detected type, readiness score)
 * back to the stored file once analysis completes.
 */
export async function updatePdfDocumentMeta(id, updates) {
  if (!id) return;
  await updateDoc(doc(db, "pdfDocuments", id), updates);
}

/** Removes a document's record. No file is stored, so there is nothing else to clean up. */
export async function deletePdfDocument({ id }) {
  try {
    await deleteDoc(doc(db, "pdfDocuments", id));
  } catch (error) {
    throw new Error("Could not delete that record. Please try again.", { cause: error });
  }
}
