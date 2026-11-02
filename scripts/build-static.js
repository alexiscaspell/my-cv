#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const PDFDocument = require('pdfkit');

const ROOT = path.join(__dirname, '..');
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const DIST_DIR = path.join(ROOT, 'dist');
const ASSETS_DIR = path.join(ROOT, 'assets');
const FONTS_DIR = path.join(ASSETS_DIR, 'fonts');

const FONT = {
  regular: 'Arial',
  bold: 'Arial-Bold',
  italic: 'Arial-Italic',
  boldItalic: 'Arial-BoldItalic',
};

// Matched to the Google Docs reference CV spacing/typography.
const SIZE = {
  name: 22,
  body: 12,
  contact: 10,
  heading: 17,
};

const SPACE = {
  top: 70,
  bottom: 50,
  left: 50,
  right: 50,
  nameToRole: 15,
  roleToContact: 16,
  // Net visual targets from the Google Docs PDF; values are slightly lower
  // because PDFKit already leaves trailing lineGap after the previous block.
  afterContact: 18,
  beforeSection: 18,
  afterSection: 23,
  jobToDates: 9,
  datesToBullets: 20,
  betweenJobs: 22,
  bodyLineGap: 8,
  contactLineGap: 7,
  bulletInset: 18,
  bulletTextInset: 36,
};

function registerPdfFonts(doc) {
  doc.registerFont(FONT.regular, path.join(FONTS_DIR, 'Arial.ttf'));
  doc.registerFont(FONT.bold, path.join(FONTS_DIR, 'Arial-Bold.ttf'));
  doc.registerFont(FONT.italic, path.join(FONTS_DIR, 'Arial-Italic.ttf'));
  doc.registerFont(FONT.boldItalic, path.join(FONTS_DIR, 'Arial-BoldItalic.ttf'));
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function stripHtml(text) {
  return String(text ?? '')
    .replace(/<a\s+[^>]*href=['"]([^'"]+)['"][^>]*>(.*?)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function labelsFor(lang) {
  return lang === 'en'
    ? {
        name: 'Name',
        role: 'Title',
        email: 'Email',
        phone: 'Phone',
        linkedin: 'LinkedIn',
        github: 'GitHub',
        whatsapp: 'WhatsApp',
        summary: 'PROFESSIONAL SUMMARY',
        experience: 'PROFESSIONAL EXPERIENCE',
        period: 'Period',
        education: 'EDUCATION',
        certifications: 'CERTIFICATIONS',
        issuer: 'Issuer',
        credential: 'Credential',
        projects: 'PROJECTS',
        url: 'URL',
        languages: 'LANGUAGES',
        interests: 'INTERESTS',
        skills: 'TECHNICAL SKILLS',
        careerProfile: 'Career Profile',
        experiences: 'Experience',
        certificationsTitle: 'Certifications',
        projectsTitle: 'Selected Projects',
        educationTitle: 'Education',
        languagesTitle: 'Languages',
        interestsTitle: 'Interests',
      }
    : {
        name: 'Nombre',
        role: 'Profesión',
        email: 'Email',
        phone: 'Teléfono',
        linkedin: 'LinkedIn',
        github: 'GitHub',
        whatsapp: 'WhatsApp',
        summary: 'PERFIL PROFESIONAL',
        experience: 'EXPERIENCIA PROFESIONAL',
        period: 'Período',
        education: 'EDUCACIÓN',
        certifications: 'CERTIFICACIONES',
        issuer: 'Emisor',
        credential: 'Credencial',
        projects: 'PROYECTOS',
        url: 'URL',
        languages: 'IDIOMAS',
        interests: 'INTERESES',
        skills: 'HABILIDADES TÉCNICAS',
        careerProfile: 'Perfil profesional',
        experiences: 'Experiencia',
        certificationsTitle: 'Certificaciones',
        projectsTitle: 'Proyectos destacados',
        educationTitle: 'Educación',
        languagesTitle: 'Idiomas',
        interestsTitle: 'Intereses',
      };
}

function prepareData(datos, lang) {
  const data = structuredClone(datos);

  (data.experiencia ?? []).forEach((e) => {
    const [mes, anio] = e.fechaInicio.split(' ');
    e.fechaInicioMes = mes;
    e.fechaInicioAnio = anio;
  });

  data.usuarioGithub = data.github.split('/').slice(-1)[0].replace('.git', '');
  data.lang = lang;
  data.isEn = lang === 'en';
  data.cvPdfFile = lang === 'en' ? 'cv-alexis-taberna.en.pdf' : 'cv-alexis-taberna.es.pdf';
  data.ui = labelsFor(lang);

  return data;
}

function contentWidth(doc) {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function resetCursorX(doc) {
  doc.x = doc.page.margins.left;
}

function ensureSpace(doc, needed = 60) {
  if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
  resetCursorX(doc);
}

function addSpace(doc, pts) {
  doc.y += pts;
}

function writeSectionTitle(doc, title, { first = false, keepWith = 48 } = {}) {
  const before = first ? 0 : SPACE.beforeSection;
  ensureSpace(doc, before + SIZE.heading + SPACE.afterSection + keepWith);
  if (!first) addSpace(doc, SPACE.beforeSection);
  resetCursorX(doc);
  doc.font(FONT.bold).fontSize(SIZE.heading).text(title, doc.page.margins.left, doc.y, {
    width: contentWidth(doc),
    lineGap: 0,
  });
  addSpace(doc, SPACE.afterSection);
  resetCursorX(doc);
}

function writeBody(doc, text, opts = {}) {
  resetCursorX(doc);
  doc.font(opts.font || FONT.regular).fontSize(SIZE.body).text(stripHtml(text), doc.page.margins.left, doc.y, {
    width: contentWidth(doc),
    align: 'left',
    lineGap: SPACE.bodyLineGap,
    ...opts,
  });
  resetCursorX(doc);
}

function writeBullet(doc, text) {
  ensureSpace(doc, 40);
  const left = doc.page.margins.left;
  const startY = doc.y;
  const bulletX = left + SPACE.bulletInset;
  const textX = left + SPACE.bulletTextInset;
  const width = doc.page.width - doc.page.margins.right - textX;
  const clean = stripHtml(text);

  doc.font(FONT.regular).fontSize(SIZE.body);
  doc.text('●', bulletX, startY, { lineBreak: false, lineGap: SPACE.bodyLineGap });
  doc.text(clean, textX, startY, {
    width,
    align: 'left',
    lineGap: SPACE.bodyLineGap,
  });
  resetCursorX(doc);
}

/** Items with ocultarEnPdf: true are skipped in the PDF. Missing field => show (false). */
function visibleInPdf(items = []) {
  return items.filter((item) => {
    if (item == null || typeof item !== 'object') return true;
    return item.ocultarEnPdf !== true;
  });
}

function paragraphsFrom(text) {
  return String(text ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function buildPdfCv(datos, lang, outPath) {
  return new Promise((resolve, reject) => {
    const data = prepareData(datos, lang);
    const labels = labelsFor(lang);
    const experiencia = visibleInPdf(data.experiencia);
    const educacion = visibleInPdf(data.educacion);
    const certificaciones = visibleInPdf(data.certificaciones);
    const lenguajes = visibleInPdf(data.lenguajes);

    const doc = new PDFDocument({
      size: 'LETTER',
      margins: {
        top: SPACE.top,
        bottom: SPACE.bottom,
        left: SPACE.left,
        right: SPACE.right,
      },
      info: {
        Title: `CV - ${data.nombre}`,
        Author: data.nombre,
        Subject: data.profesion,
      },
    });

    registerPdfFonts(doc);

    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);

    // Header
    doc.font(FONT.bold).fontSize(SIZE.name).text(String(data.nombre).toUpperCase(), {
      width: contentWidth(doc),
      lineGap: 0,
    });
    addSpace(doc, SPACE.nameToRole);
    doc.font(FONT.bold).fontSize(SIZE.body).text(data.profesion, {
      width: contentWidth(doc),
      lineGap: 0,
    });
    addSpace(doc, SPACE.roleToContact);

    doc.font(FONT.italic).fontSize(SIZE.contact).text(
      [
        `${labels.email}: ${data.correo}`,
        `${labels.phone}: ${data.telefono}`,
        `${labels.linkedin}: ${data.linkedin}`,
        `${labels.github}: ${data.github}`,
      ].join('\n'),
      {
        width: contentWidth(doc),
        lineGap: SPACE.contactLineGap,
      }
    );

    addSpace(doc, SPACE.afterContact);

    // Summary
    writeSectionTitle(doc, labels.summary, { first: true });
    for (const paragraph of paragraphsFrom(data.descripcion)) {
      writeBody(doc, paragraph);
    }

    // Experience
    if (experiencia.length) {
      writeSectionTitle(doc, labels.experience);
      experiencia.forEach((job, jobIndex) => {
        ensureSpace(doc, 90);
        if (jobIndex > 0) addSpace(doc, SPACE.betweenJobs);

        doc.font(FONT.bold).fontSize(SIZE.body).text(`${job.puesto} | ${job.empresa}`, {
          width: contentWidth(doc),
          lineGap: 0,
        });
        addSpace(doc, SPACE.jobToDates);
        doc.font(FONT.boldItalic).fontSize(SIZE.body).text(`${job.fechaInicio} – ${job.fechaFin}`, {
          width: contentWidth(doc),
          lineGap: 0,
        });

        if (Array.isArray(job.logros) && job.logros.length) {
          addSpace(doc, SPACE.datesToBullets);
          for (const logro of job.logros) {
            writeBullet(doc, logro);
          }
        } else if (job.descripcion) {
          addSpace(doc, SPACE.datesToBullets);
          writeBody(doc, job.descripcion);
        }
      });
    }

    // Skills
    if (Array.isArray(data.habilidades) && data.habilidades.length) {
      writeSectionTitle(doc, labels.skills);
      for (const skill of data.habilidades) {
        ensureSpace(doc, 36);
        const items = Array.isArray(skill.items) ? skill.items.join(', ') : '';
        const suffix = items.endsWith('.') ? '' : '.';
        resetCursorX(doc);
        doc.font(FONT.bold).fontSize(SIZE.body).text(`${skill.categoria}: `, doc.page.margins.left, doc.y, {
          width: contentWidth(doc),
          continued: true,
          lineGap: SPACE.bodyLineGap,
        });
        doc.font(FONT.regular).fontSize(SIZE.body).text(`${items}${suffix}`, {
          lineGap: SPACE.bodyLineGap,
        });
        resetCursorX(doc);
      }
    }

    // Education
    if (educacion.length) {
      writeSectionTitle(doc, labels.education);
      for (const edu of educacion) {
        ensureSpace(doc, 50);
        // Reference format: school bold, then degree/status on the next line.
        const school = edu.institucion || edu.titulo;
        const detail = edu.detalle || (edu.institucion ? edu.titulo : null);
        resetCursorX(doc);
        doc.font(FONT.bold).fontSize(SIZE.body).text(school, doc.page.margins.left, doc.y, {
          width: contentWidth(doc),
          lineGap: 0,
        });
        resetCursorX(doc);
        if (detail && detail !== school) {
          writeBody(doc, detail);
        }
        if (edu.anio) {
          writeBody(doc, edu.anio);
        }
      }
    }

    // Certifications
    if (certificaciones.length) {
      writeSectionTitle(doc, labels.certifications);
      for (const cert of certificaciones) {
        ensureSpace(doc, 55);
        const issuer = cert.emisor ? ` – ${cert.emisor}.` : '.';
        writeBullet(doc, `${cert.nombre}${issuer}`);
        doc.font(FONT.regular).fontSize(SIZE.body).fillColor('#000000');
        const credX = doc.page.margins.left + SPACE.bulletTextInset;
        const credWidth = doc.page.width - doc.page.margins.right - credX;
        doc.text(`${labels.credential}: ${cert.url}`, credX, doc.y, {
          width: credWidth,
          lineGap: SPACE.bodyLineGap,
          link: cert.url,
          underline: false,
        });
        resetCursorX(doc);
      }
    }

    // Languages
    if (lenguajes.length) {
      writeSectionTitle(doc, labels.languages, {
        keepWith: Math.max(48, lenguajes.length * 28),
      });
      for (const langItem of lenguajes) {
        const detail = langItem.detalle ? ` – ${langItem.detalle}` : '';
        writeBullet(doc, `${langItem.lenguaje}: ${langItem.nivel}${detail}.`);
      }
    }

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function renderPage(indexTemplate, timelineTemplate, datos, lang, outFile) {
  const data = prepareData(datos, lang);
  data.experienciaHtml = timelineTemplate(data);
  const html = indexTemplate(data);
  fs.writeFileSync(path.join(DIST_DIR, outFile), html, 'utf8');
  console.log(`Wrote dist/${outFile}`);
}

async function main() {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(DIST_DIR, { recursive: true });

  const indexTemplate = Handlebars.compile(
    fs.readFileSync(path.join(TEMPLATES_DIR, 'index.hbs'), 'utf8')
  );
  const timelineTemplate = Handlebars.compile(
    fs.readFileSync(path.join(TEMPLATES_DIR, 'timeline.hbs'), 'utf8')
  );

  const datosEs = loadJson(path.join(ASSETS_DIR, 'data', 'datos.es.json'));
  const datosEn = loadJson(path.join(ASSETS_DIR, 'data', 'datos.en.json'));

  renderPage(indexTemplate, timelineTemplate, datosEs, 'es', 'index.html');
  renderPage(indexTemplate, timelineTemplate, datosEn, 'en', 'en.html');

  await buildPdfCv(datosEs, 'es', path.join(DIST_DIR, 'cv-alexis-taberna.es.pdf'));
  await buildPdfCv(datosEn, 'en', path.join(DIST_DIR, 'cv-alexis-taberna.en.pdf'));
  console.log('Wrote dist/cv-alexis-taberna.es.pdf');
  console.log('Wrote dist/cv-alexis-taberna.en.pdf');

  copyDir(ASSETS_DIR, path.join(DIST_DIR, 'assets'));
  console.log('Copied assets/ → dist/assets/');

  // Keep GitHub Pages custom domain attached across workflow deploys.
  fs.writeFileSync(path.join(DIST_DIR, 'CNAME'), 'cv.toast.com.ar\n', 'utf8');
  console.log('Wrote dist/CNAME');

  console.log('Static build complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
