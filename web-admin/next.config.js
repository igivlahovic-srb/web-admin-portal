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
  turbopack: {
    root: __dirname,
  },
}

module.exports = nextConfig;
