const express = require('express');
const handlebars = require('express-handlebars').create();
const datos = require('./assets/data/datos.json');


const app = express();

app.use("/assets", express.static(__dirname + '/assets'));


// Ruta principal
app.get('/', (req, res) => {

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