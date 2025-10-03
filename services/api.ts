
export async function postToApi<T>(endpoint: string, body: any): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred while fetching.' }));
    throw new Error(errorData.message || `API error: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}
