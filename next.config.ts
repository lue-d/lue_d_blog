import type { NextConfig } from "next";
import createMDX from "@next/mdx";

// GitHub Pages 部署在子路径下，本地开发不需要
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  // 开发模式下关闭静态导出，避免 generateStaticParams 缓存导致动态路由失败
  // 生产构建时正常导出静态站点
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
  basePath,
  trailingSlash: true,
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  allowedDevOrigins: ["10.159.138.137"],
  images: {
    formats: ["image/avif", "image/webp"],
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "woaesiisdufkdawtfjyn.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

export default withMDX(nextConfig);
