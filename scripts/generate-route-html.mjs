import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const templatePath = path.join(distDir, 'index.html');

const services = {
  'refrigerator-service': {
    title: 'صيانة ثلاجات بالإسكندرية | احجز فني للمنزل الآن | Maintenance Guide',
    description: 'احجز فني ثلاجات بالإسكندرية لإصلاح ضعف التبريد وتسريب المياه وأعطال الديب فريزر في المنزل. فحص واضح وتأكيد للتكلفة قبل الإصلاح.',
    heading: 'صيانة ثلاجات بالإسكندرية',
  },
  'washing-machine-service': {
    title: 'صيانة غسالات بالإسكندرية | احجز فني للمنزل الآن | Maintenance Guide',
    description: 'احجز فني غسالات بالإسكندرية لإصلاح الغسالة الأوتوماتيك أو فوق الأوتوماتيك في المنزل. فحص العطل وتأكيد التكلفة قبل بدء الإصلاح.',
    heading: 'صيانة غسالات بالإسكندرية',
  },
  'air-conditioner-service': {
    title: 'صيانة تكييفات بالإسكندرية | فني تكييف وشحن فريون | Maintenance Guide',
    description: 'احجز فني تكييف بالإسكندرية لتنظيف وإصلاح تكييفات السبليت وفحص ضعف التبريد وتسريب الفريون والأعطال الكهربائية في المنزل.',
    heading: 'صيانة تكييفات بالإسكندرية',
  },
  'stove-service': {
    title: 'صيانة بوتاجازات وأفران بالإسكندرية | فني للمنزل | Maintenance Guide',
    description: 'احجز فني بوتاجازات وأفران بالإسكندرية لفحص ضعف اللهب والإشعال وتسريب الغاز وأعطال الفرن والميكروويف مع إجراءات أمان واضحة.',
    heading: 'صيانة بوتاجازات وأفران بالإسكندرية',
  },
  'water-heater-service': {
    title: 'صيانة سخانات بالإسكندرية | احجز فني للمنزل | Maintenance Guide',
    description: 'احجز فني سخانات بالإسكندرية لفحص السخان الكهربائي أو الغاز ومشكلة عدم التسخين وتسريب المياه والثرموستات في المنزل.',
    heading: 'صيانة سخانات بالإسكندرية',
  },
};

if (!fs.existsSync(templatePath)) {
  throw new Error(`Build template not found: ${templatePath}`);
}

const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const template = fs.readFileSync(templatePath, 'utf8');

for (const [slug, seo] of Object.entries(services)) {
  const canonical = `https://www.maintenanceguide.life/${slug}`;
  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);
  html = html.replace(/(<meta\s+name="description"\s+content=")[^"]*("\s*\/?>)/i, `$1${escapeHtml(seo.description)}$2`);
  html = html.replace(/(<link\s+rel="canonical"\s+href=")[^"]*("\s*\/?>)/i, `$1${canonical}$2`);
  html = html.replace(/(<meta\s+property="og:url"\s+content=")[^"]*("\s*\/?>)/i, `$1${canonical}$2`);
  html = html.replace(/(<meta\s+property="og:title"\s+content=")[^"]*("\s*\/?>)/i, `$1${escapeHtml(seo.title)}$2`);
  html = html.replace(/(<meta\s+property="og:description"\s+content=")[^"]*("\s*\/?>)/i, `$1${escapeHtml(seo.description)}$2`);
  html = html.replace(/(<meta\s+name="twitter:title"\s+content=")[^"]*("\s*\/?>)/i, `$1${escapeHtml(seo.title)}$2`);
  html = html.replace(/(<meta\s+name="twitter:description"\s+content=")[^"]*("\s*\/?>)/i, `$1${escapeHtml(seo.description)}$2`);
  const fallback = `<main dir="rtl" lang="ar" style="max-width:960px;margin:0 auto;padding:48px 20px;font-family:Cairo,Arial,sans-serif;color:#0f172a"><h1>${escapeHtml(seo.heading)}</h1><p style="font-size:18px;line-height:1.9">${escapeHtml(seo.description)}</p><h2>خدمة فني متخصص يصل إلى منزلك</h2><p>نقدم فحصًا واضحًا للأعطال وتأكيدًا للتكلفة قبل الإصلاح، مع إمكانية حجز موعد مناسب داخل الإسكندرية.</p><p><a href="/#booking-form">احجز فني الآن</a> أو <a href="tel:01278885772">اتصل بنا</a>.</p></main>`;
  html = html.replace('<div id="root"></div>', `<div id="root">${fallback}</div>`);

  const routeDir = path.join(distDir, slug);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, 'index.html'), html);
}

console.log(`Generated route HTML for ${Object.keys(services).length} service pages.`);
