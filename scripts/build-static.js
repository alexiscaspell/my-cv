#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const PDFDocument = require('pdfkit');

const ROOT = path.join(__dirname, '..');
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const DIST_DIR = path.join(ROOT, 'dist');
const ASSETS_DIR = path.join(ROOT, 'assets');

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
        summary: 'SUMMARY',
        experience: 'EXPERIENCE',
        period: 'Period',
        education: 'EDUCATION',
        certifications: 'CERTIFICATIONS',
        issuer: 'Issuer',
        credential: 'Credential URL',
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
        summary: 'PERFIL',
        experience: 'EXPERIENCIA',
        period: 'Período',
        education: 'EDUCACIÓN',
        certifications: 'CERTIFICACIONES',
        issuer: 'Emisor',
        credential: 'URL de credencial',
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

function ensureSpace(doc, needed = 60) {
  if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
}

function writeSectionTitle(doc, title) {
  ensureSpace(doc, 40);
  doc.moveDown(0.6);
  doc.font('Helvetica-Bold').fontSize(12).text(title);
  doc
    .moveTo(doc.page.margins.left, doc.y + 2)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y + 2)
    .strokeColor('#999999')
    .lineWidth(0.5)
    .stroke();
  doc.moveDown(0.5);
  doc.fillColor('#000000');
}

function writeBody(doc, text) {
  doc.font('Helvetica').fontSize(10).text(stripHtml(text), { align: 'left' });
}

/** Items with ocultarEnPdf: true are skipped in the PDF. Missing field => show (false). */
function visibleInPdf(items = []) {
  return items.filter((item) => {
    if (item == null || typeof item !== 'object') return true;
    return item.ocultarEnPdf !== true;
  });
}

function buildPdfCv(datos, lang, outPath) {
  return new Promise((resolve, reject) => {
    const data = prepareData(datos, lang);
    const labels = labelsFor(lang);
    const experiencia = visibleInPdf(data.experiencia);
    const educacion = visibleInPdf(data.educacion);
    const certificaciones = visibleInPdf(data.certificaciones);
    const proyectos = visibleInPdf(data.proyectos);
    const lenguajes = visibleInPdf(data.lenguajes);
    const intereses = visibleInPdf(
      (data.intereses ?? []).map((item) =>
        typeof item === 'string' ? { nombre: item } : item
      )
    );

    const doc = new PDFDocument({
      margin: 50,
      info: {
        Title: `CV - ${data.nombre}`,
        Author: data.nombre,
        Subject: data.profesion,
      },
    });

    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);

    doc.font('Helvetica-Bold').fontSize(18).text(data.nombre);
    doc.font('Helvetica').fontSize(12).text(data.profesion);
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`${labels.email}: ${data.correo}`);
    doc.text(`${labels.phone}: ${data.telefono}`);
    doc.text(`${labels.linkedin}: ${data.linkedin}`);
    doc.text(`${labels.github}: ${data.github}`);
    doc.text(`${labels.whatsapp}: ${data.whatsapp}`);

    writeSectionTitle(doc, labels.summary);
    writeBody(doc, data.descripcion);

    if (experiencia.length) {
      writeSectionTitle(doc, labels.experience);
      for (const job of experiencia) {
        ensureSpace(doc, 70);
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').fontSize(11).text(`${job.puesto} | ${job.empresa}`);
        doc.font('Helvetica-Oblique').fontSize(9).text(`${labels.period}: ${job.fechaInicio} - ${job.fechaFin}`);
        if (Array.isArray(job.logros) && job.logros.length) {
          for (const logro of job.logros) {
            ensureSpace(doc, 36);
            doc.font('Helvetica').fontSize(10).text(`• ${stripHtml(logro)}`, {
              align: 'left',
              indent: 10,
            });
          }
        } else {
          writeBody(doc, job.descripcion);
        }
      }
    }

    if (Array.isArray(data.habilidades) && data.habilidades.length) {
      writeSectionTitle(doc, labels.skills);
      for (const skill of data.habilidades) {
        ensureSpace(doc, 28);
        const items = Array.isArray(skill.items) ? skill.items.join(', ') : '';
        doc.font('Helvetica-Bold').fontSize(10).text(`${skill.categoria}: `, { continued: true });
        doc.font('Helvetica').fontSize(10).text(items);
      }
    }

    if (educacion.length) {
      writeSectionTitle(doc, labels.education);
      for (const edu of educacion) {
        ensureSpace(doc, 40);
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').fontSize(11).text(`${edu.titulo} | ${edu.institucion}`);
        doc.font('Helvetica').fontSize(9).text(`${labels.period}: ${edu.anio}`);
      }
    }

    if (certificaciones.length) {
      writeSectionTitle(doc, labels.certifications);
      for (const cert of certificaciones) {
        ensureSpace(doc, 45);
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').fontSize(10).text(`• ${cert.nombre}`);
        doc.font('Helvetica').fontSize(9).text(`${labels.issuer}: ${cert.emisor}`);
        doc.text(`${labels.credential}: ${cert.url}`);
      }
    }

    if (proyectos.length) {
      writeSectionTitle(doc, labels.projects);
      for (const project of proyectos) {
        ensureSpace(doc, 55);
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').fontSize(10).text(`• ${project.nombre}`);
        doc.font('Helvetica').fontSize(9).text(`${labels.url}: ${project.url}`);
        writeBody(doc, project.descripcion);
      }
    }

    if (lenguajes.length) {
      writeSectionTitle(doc, labels.languages);
      for (const langItem of lenguajes) {
        doc.font('Helvetica').fontSize(10).text(`• ${langItem.lenguaje}: ${langItem.nivel}`);
      }
    }

    if (intereses.length) {
      writeSectionTitle(doc, labels.interests);
      doc
        .font('Helvetica')
        .fontSize(10)
        .text(
          intereses
            .map((item) => `• ${typeof item === 'string' ? item : item.nombre ?? item.interes}`)
            .join('\n')
        );
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
