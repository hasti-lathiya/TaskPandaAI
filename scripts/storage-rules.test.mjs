import { readFileSync } from "fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { ref, uploadBytes, getBytes, deleteObject } from "firebase/storage";

const testEnv = await initializeTestEnvironment({
  projectId: "demo-taskpanda",
  storage: { rules: readFileSync("storage.rules", "utf8"), host: "127.0.0.1", port: 9199 },
});

const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // "%PDF"
const opts = { contentType: "application/pdf" };
const as = (uid) => testEnv.authenticatedContext(uid).storage();
const anon = () => testEnv.unauthenticatedContext().storage();

let pass = 0, fail = 0;
const check = async (name, p) => {
  try { await p; console.log(`PASS  ${name}`); pass++; }
  catch (e) { console.log(`FAIL  ${name}\n        ${e.message.split("\n")[0]}`); fail++; }
};

await check("alice uploads a PDF into her own folder",
  assertSucceeds(uploadBytes(ref(as("alice"), "pdfs/alice/doc.pdf"), pdf, opts)));
await check("alice CANNOT upload into bob's folder",
  assertFails(uploadBytes(ref(as("alice"), "pdfs/bob/doc.pdf"), pdf, opts)));
await check("anonymous cannot upload",
  assertFails(uploadBytes(ref(anon(), "pdfs/alice/doc.pdf"), pdf, opts)));
await check("non-PDF content type is rejected",
  assertFails(uploadBytes(ref(as("alice"), "pdfs/alice/evil.pdf"), pdf, { contentType: "text/html" })));
await check("oversized upload is rejected",
  assertFails(uploadBytes(ref(as("alice"), "pdfs/alice/big.pdf"), new Uint8Array(11 * 1024 * 1024), opts)));
await check("alice reads her own file",
  assertSucceeds(getBytes(ref(as("alice"), "pdfs/alice/doc.pdf"))));
await check("bob CANNOT read alice's file",
  assertFails(getBytes(ref(as("bob"), "pdfs/alice/doc.pdf"))));
await check("bob CANNOT delete alice's file",
  assertFails(deleteObject(ref(as("bob"), "pdfs/alice/doc.pdf"))));
await check("paths outside pdfs/ are locked",
  assertFails(uploadBytes(ref(as("alice"), "secret/x.pdf"), pdf, opts)));
await check("alice deletes her own file",
  assertSucceeds(deleteObject(ref(as("alice"), "pdfs/alice/doc.pdf"))));

await testEnv.cleanup();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
