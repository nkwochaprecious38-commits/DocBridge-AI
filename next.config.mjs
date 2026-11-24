/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pdf-parse", "mammoth", "xlsx", "jszip"],
  experimental: { serverActions: { bodySizeLimit: "25mb" } },
};
export default nextConfig;
