/* eslint-env node */
/* global __dirname */
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: false,
  },
  turbopack: {
    root: __dirname,
  },
}

module.exports = nextConfig;
