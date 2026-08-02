import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4" dir="rtl">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-white mb-4">
          Campaign Diagnosis Wizard
        </h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          أجب على أسئلة ذكية واحصل على استراتيجية إعلانية كاملة خلال دقائق
        </p>
        <Link
          href="/wizard"
          className="inline-block px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-lg transition-colors shadow-lg shadow-violet-900/30"
        >
          ابدأ الآن →
        </Link>
      </div>
    </div>
  );
}
