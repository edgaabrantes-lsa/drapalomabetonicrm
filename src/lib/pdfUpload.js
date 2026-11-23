import { appParams } from "@/lib/app-params";

// Converte base64 (PDF) em Blob
export function base64ToPdfBlob(b64) {
  const byteStr = atob(b64);
  const bytes = new Uint8Array(byteStr.length);
  for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);
  const blob = new Blob([bytes], { type: "application/pdf" });
  if (blob.size === 0) throw new Error("Arquivo gerado está vazio");
  return blob;
}

// Upload real via FormData (evita a serialização JSON que esvazia o File)
export async function uploadFileToStorage(blob, fileName, mime = "application/pdf") {
  if (!blob || blob.size === 0) throw new Error("Arquivo vazio para upload");
  const file = new File([blob], fileName, { type: mime });
  const formData = new FormData();
  formData.append("file", file);

  const baseUrl = (appParams.appBaseUrl || window.location.origin).replace(/\/$/, "");
  const headers = {};
  if (appParams.token) headers["Authorization"] = `Bearer ${appParams.token}`;

  const resp = await fetch(`${baseUrl}/api/integrations/Core/UploadFile`, {
    method: "POST",
    headers,
    body: formData,
    credentials: "include",
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => resp.statusText);
    throw new Error(`Falha no upload (${resp.status}): ${txt.substring(0, 200)}`);
  }
  const result = await resp.json();
  if (!result?.file_url) throw new Error("Upload sem URL de retorno");
  return result.file_url;
}

// Abre um PDF em nova aba a partir do base64
export function openPdfFromBase64(b64) {
  const blob = base64ToPdfBlob(b64);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 20000);
}