import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <h2 className="text-2xl font-bold text-text-primary mb-2">404 - Page Not Found</h2>
      <p className="text-text-muted mb-4">Could not find requested resource</p>
      <Link href="/" className="px-4 py-2 bg-brand text-white rounded-md text-sm">
        Return Home
      </Link>
    </div>
  );
}
