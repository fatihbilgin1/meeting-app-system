const API_BASE_URL = "http://localhost:8081/api/calendar";

export async function refreshToken() {
  const userId = localStorage.getItem("userId");
   if (!userId) throw new Error("User ID bulunamadı");
  const response = await fetch(`${API_BASE_URL}/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) throw new Error("Token yenileme başarısız");
  const data = await response.json();
  localStorage.setItem("token", data.token);
  if (data.accessToken) {
      localStorage.setItem("googleAccessToken", data.accessToken);
    }
  return data.token;
}