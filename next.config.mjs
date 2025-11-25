import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
    ],
  },
  // Allow cross-origin requests from the development environment.
  // This is necessary for the preview to work correctly in Firebase Studio.
  ...(process.env.NODE_ENV === 'development'
    ? {
        experimental: {
          allowedDevOrigins: [
            'https://*.cloudworkstations.dev',
            'https://*.firebase.studio',
          ],
        },
      }
    : {}),
};

export default nextConfig;
