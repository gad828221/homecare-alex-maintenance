import { useEffect, useState, type FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import { CheckCircle2, Loader2, MessageSquare, Star } from "lucide-react";
import { sendExternalPush } from "../utils/pushNotifications";

const supabaseUrl = "https://hjrnfsdvrrwgyppqhwml.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE";

export default function FeedbackPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOrderNumber(params.get("order") || "");
  }, []);

  const submitFeedback = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!orderNumber.trim()) return setError("يرجى إدخال رقم الأوردر.");
    if (rating < 1 || rating > 5) return setError("يرجى اختيار تقييم من نجمة إلى خمس نجوم.");

    setSubmitting(true);
    try {
      const details = `⭐ تقييم العميل للأوردر ${orderNumber.trim()}: ${rating}/5${comment.trim() ? ` | التعليق: ${comment.trim()}` : ""}`;
      const response = await fetch(`${supabaseUrl}/rest/v1/notifications`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          action: "تقييم عميل",
          details,
          user_name: "العميل",
          created_at: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error("feedback-submit-failed");
      await sendExternalPush({
        event: 'customer_feedback',
        title: '⭐ تقييم عميل جديد',
        message: details,
        targetRoles: ['admin', 'manager'],
        data: { order_number: orderNumber.trim(), rating }
      });
      setSubmitted(true);
    } catch (submitError) {
      console.error(submitError);
      setError("تعذر إرسال التقييم حالياً. يرجى المحاولة مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-5" dir="rtl">
        <Helmet><title>شكراً لتقييمك | Maintenance Guide</title></Helmet>
        <section className="w-full max-w-lg rounded-3xl bg-slate-900 border border-emerald-500/30 p-8 text-center shadow-2xl">
          <CheckCircle2 className="mx-auto text-emerald-400" size={64} />
          <h1 className="text-2xl font-black mt-5">شكراً لتقييمك</h1>
          <p className="text-slate-300 mt-3 leading-8">رأيك يساعدنا على تحسين الخدمة وتقدير أداء الفنيين.</p>
        </section>
      </main>
    );
  }

  const visibleRating = hoverRating || rating;

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-5" dir="rtl">
      <Helmet>
        <title>تقييم الخدمة | Maintenance Guide</title>
        <meta name="description" content="شاركنا تقييمك لخدمة الصيانة من Maintenance Guide." />
      </Helmet>
      <section className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-orange-500/15 flex items-center justify-center">
            <MessageSquare className="text-orange-400" size={32} />
          </div>
          <h1 className="text-2xl font-black mt-5">قيّم تجربة الصيانة</h1>
          <p className="text-slate-400 mt-2 leading-7">رأيك مهم لنا ويساعدنا في تقديم خدمة أفضل.</p>
        </div>

        <form onSubmit={submitFeedback} className="mt-8 space-y-5">
          <div>
            <label htmlFor="feedback-order" className="block text-sm font-bold text-slate-300 mb-2">رقم الأوردر</label>
            <input
              id="feedback-order"
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              placeholder="مثال: MG-123456"
              className="w-full rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-orange-500"
              required
            />
          </div>

          <fieldset>
            <legend className="block text-sm font-bold text-slate-300 mb-3">كيف تقيّم الخدمة؟</legend>
            <div className="flex justify-center gap-2" dir="ltr" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} نجوم`}
                  aria-pressed={rating === value}
                  onMouseEnter={() => setHoverRating(value)}
                  onFocus={() => setHoverRating(value)}
                  onClick={() => setRating(value)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star size={38} className={value <= visibleRating ? "text-yellow-400" : "text-slate-600"} fill={value <= visibleRating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-slate-500 mt-2">{rating ? `${rating} من 5` : "اختر عدد النجوم"}</p>
          </fieldset>

          <div>
            <label htmlFor="feedback-comment" className="block text-sm font-bold text-slate-300 mb-2">ملاحظتك (اختياري)</label>
            <textarea
              id="feedback-comment"
              rows={4}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="اكتب ملاحظتك عن الخدمة أو الفني..."
              className="w-full rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-orange-500 resize-none"
            />
          </div>

          {error && <p role="alert" className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 p-3 text-sm">{error}</p>}

          <button type="submit" disabled={submitting} className="w-full rounded-2xl bg-orange-600 hover:bg-orange-700 disabled:opacity-60 py-3 font-black flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="animate-spin" size={18} /> جارٍ الإرسال...</> : "إرسال التقييم"}
          </button>
        </form>
      </section>
    </main>
  );
}

