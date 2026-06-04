export async function uploadIdentityHeadImage(identityId: string, file: File) {
  const formData = new FormData();
  formData.set("headImage", file);

  const response = await fetch(
    `/api/proxy/identities/${identityId}/head-image`,
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to upload head image");
  }

  return data;
}
