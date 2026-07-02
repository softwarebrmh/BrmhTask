let apiHost;
try {
  apiHost = new URL(process.env.NEXT_PUBLIC_API_URL ?? '').hostname;
} catch {
  apiHost = undefined;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/uploads/**' },
      ...(apiHost && apiHost !== 'localhost'
        ? [{ protocol: 'https', hostname: apiHost, pathname: '/uploads/**' }]
        : []),
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
