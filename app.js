const express = require('express');
const handlebars = require('express-handlebars').create();
const datosEs = require('./assets/data/datos.es.json');
const datosEn = require('./assets/data/datos.en.json');


const app = express();

app.use("/assets", express.static(__dirname + '/assets'));


// Ruta principal
app.get('/', (req, res) => {

    const lang = req.url.includes("lang=") ? req.url.split("lang=")[1].split("&")[0] : 'es';

    let datos = lang=="es" ? datosEs : datosEn;

    let experiencia = datos["experiencia"] ?? [];

    experiencia.forEach(e => {
        e["fechaInicioMes"] = e["fechaInicio"].split(" ")[0]
        e["fechaInicioAnio"] = e["fechaInicio"].split(" ")[1]
    });

    datos["usuarioGithub"] = datos["github"].split("/").slice(-1)[0].replace(".git", "")

    handlebars.render("timeline.html", datos).then((experienceHtml) => {
        datos["experienciaHtml"] = experienceHtml
        handlebars.render("skills.html", datos).then((habilidadesHtml) => {
            datos["habilidadesHtml"] = habilidadesHtml
            handlebars.render("index.html", datos).then((renderedHtml) => {
                res.send(renderedHtml)
            })
        })
    })

});


// Iniciar el servidor
app.listen(3000, () => {
    console.log('Servidor iniciado en el puerto 3000');
});