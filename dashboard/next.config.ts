import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Vercel auto-deploy connected via GitHub
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
