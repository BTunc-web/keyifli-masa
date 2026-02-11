import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="text-center">
        <span className="text-5xl">🔍</span>
        <h2 className="text-2xl font-bold text-stone-800 mt-4">Dükkan Bulunamadı</h2>
        <p className="text-stone-500 mt-2">Bu adrese ait aktif bir dükkan yok.</p>
        <Link href="/" className="btn-primary inline-block mt-6">Ana Sayfaya Dön</Link>
      </div>
    </div>
  );
}