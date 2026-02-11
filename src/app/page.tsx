import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream">
      <header className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-mango-600">
          🍽️ Keyifli Masa
        </h1>
        <div className="flex gap-3">
          <Link href="/giris" className="btn-ghost">Giriş Yap</Link>
          <Link href="/kayit" className="btn-primary">Dükkan Aç 🏪</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6">
        <section className="py-16 md:py-24 text-center">
          <div className="text-6xl mb-6">👩‍🍳</div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-stone-800 leading-tight">
            Mutfağındaki Lezzetleri
            <br />
            <span className="text-mango-500">Komşularına Sat!</span>
          </h2>
          <p className="text-lg text-stone-500 mt-6 max-w-xl mx-auto leading-relaxed">
            Dükkanını aç, yemeklerini ekle, linkini WhatsApp'tan paylaş.
            Komşuların üye olmadan hemen sipariş versin!
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
            <Link href="/kayit" className="btn-primary text-lg px-10 py-4">
              Ücretsiz Başla 🚀
            </Link>
            <Link href="/dukkan/demo" className="btn-secondary text-lg px-10 py-4">
              Demo Görüntüle 👀
            </Link>
          </div>
        </section>

        <section className="py-12">
          <h3 className="text-center text-2xl font-display font-bold text-stone-700 mb-10">
            3 Adımda Başla ✨
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-3xl border-2 p-8 text-center transition-transform hover:scale-105 bg-mango-50 border-mango-200">
              <span className="text-5xl">🏪</span>
              <h4 className="text-xl font-display font-bold text-stone-800 mt-5">Dükkanını Aç</h4>
              <p className="text-base text-stone-500 mt-3 leading-relaxed">Kayıt ol, dükkan adını yaz. 30 saniyede hazır!</p>
            </div>
            <div className="rounded-3xl border-2 p-8 text-center transition-transform hover:scale-105 bg-sunshine-50 border-sunshine-200">
              <span className="text-5xl">🍲</span>
              <h4 className="text-xl font-display font-bold text-stone-800 mt-5">Yemeklerini Ekle</h4>
              <p className="text-base text-stone-500 mt-3 leading-relaxed">Ne pişiriyorsan ekle, fiyatını belirle. Çok kolay!</p>
            </div>
            <div className="rounded-3xl border-2 p-8 text-center transition-transform hover:scale-105 bg-mint-50 border-mint-200">
              <span className="text-5xl">📱</span>
              <h4 className="text-xl font-display font-bold text-stone-800 mt-5">Linkini Paylaş</h4>
              <p className="text-base text-stone-500 mt-3 leading-relaxed">WhatsApp'tan gönder, komşuların hemen sipariş versin!</p>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="rounded-3xl bg-gradient-to-br from-mango-500 to-mango-600 p-10 md:p-16 text-center text-white">
            <div className="text-5xl mb-4">💛</div>
            <h3 className="text-2xl md:text-3xl font-display font-bold">
              Binlerce Ev Hanımı Keyifli Masa ile Kazanıyor
            </h3>
            <p className="text-lg mt-4 opacity-90 max-w-lg mx-auto">
              Sen de mutfağındaki yeteneklerini gelire dönüştür. Hiçbir ücret yok!
            </p>
            <Link href="/kayit" className="inline-block mt-8 px-10 py-4 bg-white text-mango-600 rounded-2xl font-bold text-lg hover:bg-mango-50 transition-all shadow-lg">
              Hemen Başla 🎉
            </Link>
          </div>
        </section>

        <footer className="py-10 text-center border-t border-stone-100 mt-8">
          <p className="text-stone-400 text-sm">
            🍽️ Keyifli Masa — Ev yapımı lezzetlerin buluşma noktası
          </p>
        </footer>
      </main>
    </div>
  );
}