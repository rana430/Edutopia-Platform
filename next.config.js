/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
      appDir: true,  // Ensure this is enabled
    },
  };
  
  module.exports = {
    reactStrictMode: true,
    webpack(config) {
      config.module.rules.push({
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      });
      return config;
    },
  };
    