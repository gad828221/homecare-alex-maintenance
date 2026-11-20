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


const brandPages = {
  'samsung-service': {
    title: 'صيانة سامسونج بالإسكندرية | إصلاح أجهزة Samsung في المنزل | Maintenance Guide',
    description: 'اطلب صيانة سامسونج في الإسكندرية لإصلاح الثلاجات والغسالات والتكييفات في المنزل. حجز سريع، فني متخصص وضمان على الخدمة.',
    heading: 'صيانة سامسونج بالإسكندرية',
  },
  'lg-service': {
    title: 'صيانة LG بالإسكندرية | إصلاح غسالات وثلاجات LG | Maintenance Guide',
    description: 'خدمة صيانة LG في الإسكندرية لإصلاح الغسالات والثلاجات والتكييفات في المنزل. احجز فنيًا متخصصًا وتواصل معنا لتأكيد الموعد.',
    heading: 'صيانة LG بالإسكندرية',
  },
  'sharp-service': {
    title: 'صيانة شارب بالإسكندرية | إصلاح أجهزة Sharp في المنزل | Maintenance Guide',
    description: 'اطلب صيانة شارب في الإسكندرية لإصلاح الثلاجات والغسالات والتكييفات في المنزل. خدمة سريعة وفني متخصص وضمان على الخدمة.',
    heading: 'صيانة شارب بالإسكندرية',
  },
  'toshiba-service': {
    title: 'صيانة توشيبا بالإسكندرية | إصلاح أجهزة Toshiba في المنزل | Maintenance Guide',
    description: 'خدمة صيانة توشيبا في الإسكندرية لإصلاح الثلاجات والغسالات والتكييفات في المنزل. احجز موعدك وسنتواصل معك لتأكيد التفاصيل.',
    heading: 'صيانة توشيبا بالإسكندرية',
  },
  'zanussi-service': {
    title: 'صيانة زانوسي بالإسكندرية | إصلاح غسالات وثلاجات Zanussi | Maintenance Guide',
    description: 'اطلب صيانة زانوسي في الإسكندرية لإصلاح الغسالات والثلاجات في المنزل. فني متخصص، حجز سريع وضمان على الخدمة.',
    heading: 'صيانة زانوسي بالإسكندرية',
  },
  'unionaire-service': {
    title: 'صيانة يونيون إير بالإسكندرية | إصلاح تكييفات Unionaire | Maintenance Guide',
    description: 'خدمة صيانة يونيون إير في الإسكندرية لإصلاح التكييفات والثلاجات في المنزل. احجز فنيًا متخصصًا وسنتواصل معك لتأكيد الموعد.',
    heading: 'صيانة يونيون إير بالإسكندرية',
  },
  'fresh-service': {
    title: 'صيانة فريش بالإسكندرية | إصلاح غسالات وثلاجات Fresh | Maintenance Guide',
    description: 'اطلب صيانة فريش في الإسكندرية لإصلاح الغسالات والثلاجات في المنزل. خدمة سريعة وفني متخصص وضمان على الخدمة.',
    heading: 'صيانة فريش بالإسكندرية',
  },
  'white-whale-service': {
    title: 'صيانة وايت ويل بالإسكندرية | إصلاح غسالات وثلاجات White Whale | Maintenance Guide',
    description: 'خدمة صيانة وايت ويل في الإسكندرية لإصلاح الغسالات والثلاجات في المنزل. احجز فنيًا متخصصًا وسنتواصل معك لتأكيد الموعد.',
    heading: 'صيانة وايت ويل بالإسكندرية',
  },
  'ariston-service': {
    title: 'صيانة أريستون بالإسكندرية | إصلاح غسالات وسخانات Ariston | Maintenance Guide',
    description: 'اطلب صيانة أريستون في الإسكندرية لإصلاح الغسالات والسخانات في المنزل. فني متخصص وحجز سريع وضمان على الخدمة.',
    heading: 'صيانة أريستون بالإسكندرية',
  },
  'beko-service': {
    title: 'صيانة بيكو بالإسكندرية | إصلاح غسالات وثلاجات Beko | Maintenance Guide',
    description: 'خدمة صيانة بيكو في الإسكندرية لإصلاح الغسالات والثلاجات في المنزل. احجز موعدك وسنتواصل معك لتأكيد التفاصيل.',
    heading: 'صيانة بيكو بالإسكندرية',
  },
  'hoover-service': {
    title: 'صيانة هوفر بالإسكندرية | إصلاح غسالات وأجهزة Hoover | Maintenance Guide',
    description: 'اطلب صيانة هوفر في الإسكندرية لإصلاح الغسالات والأجهزة المنزلية في المنزل. فني متخصص وحجز سريع وضمان على الخدمة.',
    heading: 'صيانة هوفر بالإسكندرية',
  },
  'indesit-service': {
    title: 'صيانة إنديست بالإسكندرية | إصلاح غسالات وثلاجات Indesit | Maintenance Guide',
    description: 'خدمة صيانة إنديست في الإسكندرية لإصلاح الغسالات والثلاجات في المنزل. احجز فنيًا متخصصًا وسنتواصل معك لتأكيد الموعد.',
    heading: 'صيانة إنديست بالإسكندرية',
  },
  'service-areas': {
    title: 'مناطق خدمة الصيانة في الإسكندرية | فني أجهزة منزلية قريب منك | Maintenance Guide',
    description: 'نقدم صيانة أجهزة منزلية في سموحة وسيدي جابر وسيدي بشر ولوران وسان ستيفانو وميامي والعجمي ومناطق الإسكندرية. احجز فني ثلاجات أو غسالات أو تكييفات في المنزل.',
    heading: 'مناطق خدمة الصيانة في الإسكندرية',
  },
};

Object.assign(services, brandPages);

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
  html = html.replace(/<title[^>]*>[^<]*<\/title>/i, `<title data-rh="true">${escapeHtml(seo.title)}</title>`);
  html = html.replace(/(<meta\s+name="description"\s+content=")[^"]*("[^>]*\/?>)/i, `$1${escapeHtml(seo.description)}$2`);
  html = html.replace(/(<link\s+rel="canonical"\s+href=")[^"]*("[^>]*\/?>)/i, `$1${canonical}$2`);
  html = html.replace(/(<meta\s+property="og:url"\s+content=")[^"]*("[^>]*\/?>)/i, `$1${canonical}$2`);
  html = html.replace(/(<meta\s+property="og:title"\s+content=")[^"]*("[^>]*\/?>)/i, `$1${escapeHtml(seo.title)}$2`);
  html = html.replace(/(<meta\s+property="og:description"\s+content=")[^"]*("[^>]*\/?>)/i, `$1${escapeHtml(seo.description)}$2`);
  html = html.replace(/(<meta\s+property="twitter:title"\s+content=")[^"]*("[^>]*\/?>)/i, `$1${escapeHtml(seo.title)}$2`);
  html = html.replace(/(<meta\s+property="twitter:description"\s+content=")[^"]*("[^>]*\/?>)/i, `$1${escapeHtml(seo.description)}$2`);
  const fallback = `<main dir="rtl" lang="ar" style="max-width:960px;margin:0 auto;padding:48px 20px;font-family:Cairo,Arial,sans-serif;color:#0f172a"><h1>${escapeHtml(seo.heading)}</h1><p style="font-size:18px;line-height:1.9">${escapeHtml(seo.description)}</p><h2>خدمة فني متخصص يصل إلى منزلك</h2><p>نقدم فحصًا واضحًا للأعطال وتأكيدًا للتكلفة قبل الإصلاح، مع إمكانية حجز موعد مناسب داخل الإسكندرية.</p><p><a href="/#booking-form">احجز فني الآن</a> أو <a href="tel:01278885772">اتصل بنا</a>.</p></main>`;
  html = html.replace('<div id="root"></div>', `<div id="root">${fallback}</div>`);

  const routeDir = path.join(distDir, slug);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, 'index.html'), html);
}

console.log(`Generated route HTML for ${Object.keys(services).length} service pages.`);
