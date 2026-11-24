import { getContext, canWrite } from "@/lib/session";
import { PageTitle, Notice } from "@/components/ui";
import { Uploader } from "./uploader";
import { aiEnabled } from "@/lib/ai";

export default async function UploadPage() {
  const { role } = await getContext();
  return (
    <>
      <PageTitle title="Upload Documents" text="Add one or many files. Each file is stored privately, parsed, classified, summarized and indexed." />
      {!canWrite(role) && <Notice kind="warn">Your role is read only. Ask an administrator for member access to upload documents.</Notice>}
      {!aiEnabled && <Notice kind="warn">AI is not configured on this server (ANTHROPIC_API_KEY). Text based files will be parsed and indexed, but OCR for scanned files, extraction, and AI summaries will be unavailable.</Notice>}
      {canWrite(role) && <Uploader />}
    </>
  );
}
