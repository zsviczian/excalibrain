export function extractURLs(input: string): { url: string; alias: string }[] {
  const urlRegex = /\[([^\]]+)\]\((https?:\/\/\S+)\)/g; // [alias](url) markdown link format
  const plainTextUrlRegex = /(?:^|\s)(https?:\/\/\S+)/g; // Plain text URL format

  const urls: { url: string; alias: string }[] = [];

  // Extract URLs from [alias](url) markdown links
  let match;
  while ((match = urlRegex.exec(input))) {
    const alias = match[1];
    const url = match[2];
    urls.push({ url, alias });
  }

  // Extract plain text URLs
  while ((match = plainTextUrlRegex.exec(input))) {
    const alias = match[1]; // Alias is the URL itself for plain text URLs
    const url = match[1];
    urls.push({ url, alias });
  }

  return urls;
}