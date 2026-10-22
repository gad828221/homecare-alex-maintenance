import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const templatePath = path.join(distDir, 'index.html');

const services = {
  'refrigerator-service': {
    title: 'صيانة ثلاجات بالإسكندرية | فني ثلاجات في المنزل | Maintenance Guide',
    description: 'اطلب فني ثلاجات في الإسكندرية لإصلاح ضعف التبريد وتسريب المياه وتراكم الثلج وأعطال الديب فريزر في المنزل، مع فحص واضح وضمان على الخدمة.',
  },
  'washing-machine-service': {
    title: 'صيانة غسالات بالإسكندرية | تصليح غسالات في المنزل | Maintenance Guide',
    description: 'خدمة تصليح غسالات في الإسكندرية للغسالات الأوتوماتيك وفوق الأوتوماتيك وغسالات الأطباق. فني متخصص يصل إلى المنزل لفحص العطل وتأكيد التكلفة.',
  },
  'air-conditioner-service': {
    title: 'صيانة تكييفات بالإسكندرية | فني تكييف وشحن فريون | Maintenance Guide',
    description: 'اطلب فني تكييف في الإسكندرية لتنظيف وصيانة التكييفات والسبليت، وفحص ضعف التبريد وتسريب الفريون والأعطال الكهربائية في المنزل.',
  },
  'stove-service': {
    title: 'صيانة بوتاجازات وأفران بالإسكندرية | فني في المنزل | Maintenance Guide',
    description: 'خدمة صيانة بوتاجازات وأفران في الإسكندرية لفحص ضعف اللهب ومشاكل الإشعال وتسريب الغاز وأعطال الأفران والميكروويف مع مراعاة عوامل الأمان.',
  },
  'water-heater-service': {
    title: 'صيانة سخانات بالإسكندرية | فني سخانات في المنزل | Maintenance Guide',
    description: 'اطلب فني سخانات في الإسكندرية لفحص السخان الكهربائي أو الغاز ومشاكل عدم التسخين وتسريب المياه والثرموستات في المنزل.',
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
  const canonical = `https://maintenanceguide.life/${slug}`;
  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);
  html = html.replace(/(<meta\s+name="description"\s+content=")[^"]*("\s*\/?>)/i, `$1${escapeHtml(seo.description)}$2`);
  html = html.replace(/(<link\s+rel="canonical"\s+href=")[^"]*("\s*\/?>)/i, `$1${canonical}$2`);
  html = html.replace(/(<meta\s+property="og:url"\s+content=")[^"]*("\s*\/?>)/i, `$1${canonical}$2`);
  html = html.replace(/(<meta\s+property="og:title"\s+content=")[^"]*("\s*\/?>)/i, `$1${escapeHtml(seo.title)}$2`);
  html = html.replace(/(<meta\s+property="og:description"\s+content=")[^"]*("\s*\/?>)/i, `$1${escapeHtml(seo.description)}$2`);
  html = html.replace(/(<meta\s+name="twitter:title"\s+content=")[^"]*("\s*\/?>)/i, `$1${escapeHtml(seo.title)}$2`);
  html = html.replace(/(<meta\s+name="twitter:description"\s+content=")[^"]*("\s*\/?>)/i, `$1${escapeHtml(seo.description)}$2`);

  const routeDir = path.join(distDir, slug);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, 'index.html'), html);
}

console.log(`Generated route HTML for ${Object.keys(services).length} service pages.`);
