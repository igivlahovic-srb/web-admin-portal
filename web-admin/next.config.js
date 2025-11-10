/* eslint-env node */
/* global __dirname */
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "../"),
  experimental: {
    externalDir: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ["app", "lib", "components", "types"],
  },
}

module.exports = nextConfig;
