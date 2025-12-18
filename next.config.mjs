import { fileURLToPath } from "node:url";
import createJiti from "jiti";
import withSerwistInit from "@serwist/next";

// Import env here to validate during build. Using jiti we can import .ts files :)
const jiti = createJiti(fileURLToPath(import.meta.url));
jiti("./src/env");

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  // Add the packages in transpilePackages for standalone output
  transpilePackages: ["@t3-oss/env-nextjs", "@t3-oss/env-core"],
};

export default withSerwist(nextConfig);
