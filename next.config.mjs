const headers = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(self)" },
];
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() { return [{ source: "/(.*)", headers }]; },
};
export default nextConfig;
