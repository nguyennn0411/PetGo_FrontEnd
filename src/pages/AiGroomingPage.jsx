import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, Sparkles, Wand2, XCircle } from 'lucide-react';
import { getAiGroomingSuggestions } from '../api/aiGrooming';

const loadingSteps = [
  'Đang tải ảnh thú cưng lên PetGo...',
  'Gemini đang phân tích giống, màu lông và dáng mặt...',
  'AI đang chọn 3 kiểu lông phù hợp nhất...',
  'OpenAI đang tạo ảnh minh họa cho từng kiểu lông...',
  'Đang hoàn thiện kết quả cho sen...',
];

export default function AiGroomingPage() {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');

  const canSubmit = useMemo(() => selectedFile && !loading, [selectedFile, loading]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('');
      return undefined;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  useEffect(() => {
    if (!loading) return undefined;

    setLoadingStep(0);
    const timer = setInterval(() => {
      setLoadingStep((current) => Math.min(current + 1, loadingSteps.length - 1));
    }, 2800);

    return () => clearInterval(timer);
  }, [loading]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setError('');
    setSuggestions([]);

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSelectedFile(null);
      setError('Anh vui lòng chọn file ảnh JPG, PNG hoặc WEBP nhé.');
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      setSelectedFile(null);
      setError('Ảnh đang lớn hơn 6MB. Anh nén ảnh lại rồi thử lại nhé.');
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setError('Anh cần chọn ảnh thú cưng trước.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuggestions([]);

      const data = await getAiGroomingSuggestions(selectedFile);
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'AI Grooming đang gặp lỗi. Anh thử lại sau hoặc kiểm tra API key nhé.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setSuggestions([]);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 px-4 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-[2rem] bg-white/80 p-6 shadow-xl shadow-orange-100 backdrop-blur md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700">
                <Sparkles className="h-4 w-4" />
                PetGo AI Grooming Suggestion
              </div>

              <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
                Gợi ý kiểu lông cho bé cưng bằng AI
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                Tải ảnh thú cưng lên, PetGo sẽ phân tích giống và màu lông bằng Gemini,
                sau đó tạo ảnh minh họa từng kiểu lông bằng AI tạo ảnh.
              </p>

              <div className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                <InfoPill icon="1" text="Phân tích ảnh" />
                <InfoPill icon="2" text="Gợi ý 3 kiểu" />
                <InfoPill icon="3" text="Có ảnh minh họa" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="rounded-[1.75rem] border border-orange-100 bg-white p-5 shadow-lg">
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                className="group relative flex min-h-[300px] cursor-pointer items-center justify-center overflow-hidden rounded-[1.5rem] border-2 border-dashed border-orange-200 bg-orange-50/70 transition hover:border-orange-400 hover:bg-orange-50"
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Ảnh thú cưng đã chọn" className="h-full max-h-[360px] w-full object-cover" />
                ) : (
                  <div className="px-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <ImagePlus className="h-8 w-8 text-orange-500" />
                    </div>
                    <p className="text-lg font-bold text-slate-800">Bấm để chọn ảnh thú cưng</p>
                    <p className="mt-2 text-sm text-slate-500">Hỗ trợ JPG, PNG, WEBP. Tối đa 6MB.</p>
                  </div>
                )}

                {previewUrl && !loading && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearImage();
                    }}
                    className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-slate-600 shadow hover:text-red-500"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-4 font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
                {loading ? 'AI đang xử lý...' : 'Tạo gợi ý kiểu lông'}
              </button>
            </form>
          </div>
        </div>

        {loading && <LoadingPanel step={loadingStep} />}

        {!loading && suggestions.length > 0 && (
          <section className="mt-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="font-semibold text-orange-600">Kết quả AI</p>
                <h2 className="text-2xl font-black text-slate-900">3 kiểu lông phù hợp cho bé</h2>
              </div>
              <Camera className="hidden h-8 w-8 text-orange-400 sm:block" />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {suggestions.map((item, index) => (
                <GroomingStyleCard key={`${item.styleName}-${index}`} item={item} index={index} />
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function InfoPill({ icon, text }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 font-semibold shadow-sm">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white">{icon}</span>
      {text}
    </div>
  );
}

function LoadingPanel({ step }) {
  const progress = ((step + 1) / loadingSteps.length) * 100;

  return (
    <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-xl shadow-orange-100">
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-orange-100">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
        <div className="flex-1">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="font-bold text-slate-900">{loadingSteps[step]}</p>
            <span className="text-sm font-semibold text-orange-600">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-orange-100">
            <div className="h-full rounded-full bg-orange-500 transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Quá trình này có thể lâu hơn bình thường vì hệ thống đang gọi nối tiếp Gemini và 3 ảnh AI song song.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="overflow-hidden rounded-3xl border border-orange-100 bg-orange-50/70">
            <div className="h-48 animate-pulse bg-orange-100" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-2/3 animate-pulse rounded bg-orange-100" />
              <div className="h-3 w-full animate-pulse rounded bg-orange-100" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-orange-100" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function GroomingStyleCard({ item, index }) {
  const [imageError, setImageError] = useState(false);

  return (
    <article className="group overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-orange-100 transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="relative h-72 overflow-hidden bg-orange-100">
        {item.imageUrl && !imageError ? (
          <img
            src={item.imageUrl}
            alt={item.styleName}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm font-semibold text-orange-700">
            Ảnh minh họa chưa tạo được, nhưng kiểu lông này vẫn có thể dùng.
          </div>
        )}

        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm font-black text-orange-600 shadow">
          Gợi ý #{index + 1}
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-xl font-black text-slate-900">{item.styleName}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
      </div>
    </article>
  );
}
