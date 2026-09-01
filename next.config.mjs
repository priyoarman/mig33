/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.tenor.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.giphy.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
