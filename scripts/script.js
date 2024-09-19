/*SPA aplication all in one*/

// Importar las funciones de Firebase que necesitamoss
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-app.js";
import { getFirestore, collection, query, where, addDoc, getDocs, orderBy, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-firestore.js";

// Configuración de FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyDKZ2_jFSY1zp4en-k9kuTNyOJbT_w9YoM",
    authDomain: "japanquiz-9f25a.firebaseapp.com",
    projectId: "japanquiz-9f25a",
    storageBucket: "japanquiz-9f25a.appspot.com",
    messagingSenderId: "251926133409",
    appId: "1:251926133409:web:b61118a8c9a130d4df0ee0"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar DDBB
const db = getFirestore(app);

//---- datos ----

// mensajes de carga
const loadingMessages = ["Cargando preguntas...",
    "Traduciendo preguntas...",
    "Cargando interfaz...",
    "Limpiando Registro...",
    "Matando Demonios...",
    "Cargando efectos Espaciales...",
    "Arrancando Central Nucelar...",
    "Cargando..."];

//---- variables ----
// quiz options
const numQuestions = 10;
let difficulty = "easy";
let category = "31";

//batch of questions
let questionsBatch = {}

//for iteration between screens
let actualQuestion = 0;
// global variable to control with question is validated
let validated = -1;

//score
let score = 0;

//---- DOM elements ----
const parser = new DOMParser()
// Selectores
const quizOptionsForm = document.querySelector("#quiz-options-form");
const spinnerContainer = document.getElementById('spinner-container');
const loadingTips = document.getElementById('loadingTips');

const verde = '#43f343'
const rojo = "#ff0000"

//---- functions ----

//resetear la aplicacion
function reset() {

    questionsBatch = {};
    score = 0;
    //used to folow the status
    actualQuestion = 0;
    validated = -1;

    //delete previous quiz
    document.querySelector("section#quiz-screen").innerHTML = ""

    //reset view to home hide all windows and popups except home
    let allScreensPopups = document.querySelectorAll('[id$="-screen"],[id$="-popup"]')
    for (const el of allScreensPopups) {
        el.setAttribute("hidden", "")
    }
    document.querySelector("section#landing-screen").removeAttribute("hidden")

}

// Enviar datos a Firestore y resetear la aplicación
async function sendAndReset(event) {
    event.preventDefault();
    let nick = event.target.querySelector("input#nick").value
    // datos para enviar

    // si la categoria es 31 es a sino es v
    let c = category == "31" ? "A" : "V";
    
    // si la dificultad es easy es F sino es M si no es D
    let d = difficulty == "easy" ? "F" : difficulty == "medium" ? "M" : "D";

    let data = { nick: nick, score: score , category: c, difficulty: d };
    // console.log("datos para enviar -> ",data);

    // Comprobar si el usuario ya existe

    const q = query(collection(db, "users"), where("nick", "==", nick));

    const querySnapshot = await getDocs(q);

    // console.log(querySnapshot);

    if (!querySnapshot.empty) {
        // Actualizar el score si ya existe
        querySnapshot.forEach((doc) => {
            // console.log(doc.id, " => ", doc.data());
            if (score > doc.data().score) {
                updateDoc(doc.ref, {
                    score: score
                }).then(() => { alert("Score actualizado") });
            } else {
                alert("Tu score no ha sido suficiente para superar tu record anterior");
            }
        });
    } else {
        // Crear un nuevo usuario si no existe
        await addDoc(collection(db, "users"), data).then(() => { alert("Usuario creado") });
    }

    reset()
}

// - funciones que llaman a apis -

// api de preguntas
async function fetchQuestions() {

    const questionsApiUrl = `https://opentdb.com/api.php?amount=${numQuestions}&category=${category}&difficulty=${difficulty}&type=multiple`

    return await fetch(questionsApiUrl)
        .then(res => res.json())
        .then((data) => {
            return data;
        })
        .catch((error) => console.error("Error calling to api: ", error));//si llega aqui pasa algo con la api
}

// api de traduccion
async function translateQuestions(untraslatedQuestions) {
    //preparar las preguntas en un solo string para traducir
    let allQuestions = ""
    for (const questionObjet of untraslatedQuestions.results) {
        allQuestions += questionObjet.question + "|"
            + questionObjet.correct_answer + "|"
            + questionObjet.incorrect_answers.slice().reduce((acc, curr, i) => {
                if (i < 2) {
                    return acc + curr + "|"
                } else {
                    return acc + curr
                }
            }, "") + "|"
    }
    // delete the last pipe
    allQuestions = allQuestions.slice(0, -1)

    // console.log(allQuestions);

    let parsed = parser.parseFromString(allQuestions, "text/html").body.textContent

    // console.log(parsed);

    // llamada a la api de traduccion
    let url = `https://api.mymemory.translated.net/get?q=${parsed}&langpair=en|es&de=fordrsmax@gmail.com`
    try {
        let res = await fetch(url)
        await res.json().then(data => {

            // volver a guardar las preguntas traducidas en el objeto
            let array = data.responseData.translatedText.split("|")

            // console.log(array);

            if (array.length != 5 * numQuestions) {
                showPopupMessage("Error en la traducción de preguntas")
            } else {
                for (let i = 0; i < numQuestions; i++) {
                    untraslatedQuestions.results[i].question = array[i * 5]
                    untraslatedQuestions.results[i].correct_answer = array[i * 5 + 1]
                    untraslatedQuestions.results[i].incorrect_answers = [array[i * 5 + 2], array[i * 5 + 3], array[i * 5 + 4]]
                }
            }
        })
    } catch (error) {
        showPopupMessage("Error en la traducción de preguntas")
        console.log("Error en la traducción de preguntas")
    }
}

//---- funciones de utilidad ----

//funcion para mostrar mensajes emergentes
function showPopupMessage(message) {
    let floatingDiv = document.createElement('div');
    floatingDiv.textContent = message;
    floatingDiv.style.position = 'fixed';
    floatingDiv.style.top = '50%';
    floatingDiv.style.left = '50%';
    floatingDiv.style.transform = 'translate(-50%, -50%)';
    floatingDiv.style.backgroundColor = '#00303b';
    floatingDiv.style.color = '#8fb013';
    floatingDiv.style.borderColor = 'red';
    floatingDiv.style.borderStyle = 'solid';
    floatingDiv.style.borderWidth = '5px';
    floatingDiv.style.padding = '20px';
    floatingDiv.style.borderRadius = '10px';
    floatingDiv.style.zIndex = '1000';
    document.body.appendChild(floatingDiv);

    setTimeout(() => {
        document.body.removeChild(floatingDiv);
    }, 5000);
}

//para mezcar un array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

//aleatorizar donde esta la respuecta correcta
function generateRandomOrderHtml(questionObjet) {

    const answers = questionObjet.incorrect_answers.slice();
    answers.push(questionObjet.correct_answer);

    //barajea las breguntas
    shuffleArray(answers);

    let tmpHtml = '';
    answers.forEach(answer => {
        tmpHtml += `<label class='answer' for="${answer}">${answer}</label>
        <input type='radio' name="${answer}" id="${answer}" value="${answer}" hidden></input>`;
    });

    return tmpHtml;
}

//funcion para generar el quiz
async function generateQuiz(questions) {
    let section = document.querySelector("section#quiz-screen")
    let contentHtml = `<form id="quizform">`
    let cont = 0
    for (const questionObjet of questions.results) {

        let q = questionObjet.question
        contentHtml += `<fieldset class="contenedor-pregunta" id='Q${cont}' hidden><legend>${q}</legend>`

        //necesito una funcion que asigne esas lineas en orden aleatorio
        contentHtml += generateRandomOrderHtml(questionObjet)

        contentHtml += '</fieldset>'
        cont++
    }
    contentHtml += `<input id='submitAnswers' type='submit' class='pixel2' value='Ver Resultados'></input>`
    contentHtml += "</form>"
    section.innerHTML += contentHtml;

    document.querySelector("#quizform").addEventListener("submit", validateQuiz)
}



function validateQuiz(event) {
    event.preventDefault();
    // console.log(event.target);

    // pedir el nickname para asignar el score
    let contentHtml = `<form id="resultForm">`

    contentHtml += `<H3>has acertado ${score} de 10 preguntas</H3>`

    //calcular el incremento de puntuacion
    let incremento = difficulty == "easy" ? 0 : difficulty == "medium" ?  5 : 10;

    // etiqueta de dificultad en español
    let dificultadHtml = difficulty == "easy" ? "Fácil" : difficulty == "medium" ? "Medio" : "Difícil";

    contentHtml += `<h3>Has jugado en la categoría de ${category == "31" ? "Anime" : "Videojuegos"} y en la dificultad de ${dificultadHtml}</h3>`

    contentHtml += `<h3>Tu puntuación final es...</h3>
                    <h3 id="score"> ${score} + ${incremento} = ${score + incremento}</h3>
                    <label for="nick">Introduce tu nickname:</label>
                    <input type="text" id="nick" name="nick" class="nick-input" maxlength=10 required>
                    <p class="msg"></p>      
                    <p class="msgerr"></p>
                    <button type="submit" class="pixel2">Enviar</button>
                    </form>`

    score += incremento

    // Pintar pantalla de resultados

    document.getElementById("results-screen").toggleAttribute("hidden");
    document.getElementById("results-screen").innerHTML = contentHtml

    document.getElementById("resultForm").addEventListener("submit", sendAndReset);

    //focus on the input
    setTimeout(() => {
        document.getElementById("nick").focus({ preventScroll: false })
    }, 2000);
}

function validateOne(event) {

    if (validated < actualQuestion) {

        let preguntaActual = questionsBatch.results[actualQuestion]

        let v = event.target.nextSibling.nextSibling.value

        let labelActual = event.target
        try {
            let labelCoorrecta = labelActual.parentElement
                .querySelector(`[id*="${preguntaActual.correct_answer}"]`)
                .previousSibling.previousSibling

            if (v == preguntaActual.correct_answer) {
                score++
                labelActual.style.background = verde
                labelActual.style.color = verde
            } else {
                labelActual.style.background = rojo
                labelActual.style.color = rojo

                labelCoorrecta.style.background = verde
                labelCoorrecta.style.color = verde
            }
        } catch (error) {
            labelActual.style.background = verde
            labelActual.style.color = verde
            alert("Error en la validacion , Pregunta dada por correcta")
            score++
        }

        validated = actualQuestion

        setTimeout(nextQuestion, 1500)

    }

    if (actualQuestion + 1 == numQuestions) {
        document.querySelector("input#submitAnswers").style.display = "block"

        //wait 3 seconds and focus on the submit button smothly
        setTimeout(() => {
            document.querySelector("input#submitAnswers").focus({ preventScroll: false })
        }, 3000);
    }

}

function nextQuestion() {

    if (actualQuestion + 1 < numQuestions) {
        document.querySelector("#Q" + actualQuestion + "").toggleAttribute("hidden");
        document.querySelector("#Q" + (actualQuestion + 1) + "").toggleAttribute("hidden");
        actualQuestion++
    }

}

//funcion para pasar al quiz
async function start() {

    spinnerContainer.style.display = 'block';

    //obtener valores de la categoria y dificultad
    category = quizOptionsForm.querySelector("select#category").value

    difficulty = quizOptionsForm.querySelector("select#difficulty").value

    //loading tips
    setInterval(function () {
        let randomIndex = Math.floor(Math.random() * loadingMessages.length)
        loadingTips.innerHTML = loadingMessages[randomIndex]
    }, 1000);

    //aqui se hace una llamada a api
    try {

        // // test exception
        // throw new Error("Error en la llamada a la api")

        questionsBatch = await fetchQuestions()

        await translateQuestions(questionsBatch)

    } catch (error) {

        // showPopupMessage("Error en la llamada a la api")

        let responseData = {}

        switch (category) {
            case "31":
                responseData = await fetch(`./data/anime-${difficulty}.json`)
                break;

            case "15":
                responseData = await fetch(`./data/videoGames-${difficulty}.json`)
                break;
        
            default:
                responseData = await fetch(`./data/anime-${difficulty}.json`)
                break;
        }
        //parseamos el json
        questionsBatch = await responseData.json()

    }

    // console.log(questionsBatch);

    //constrimos quiz con template string
    await generateQuiz(questionsBatch)

    let preguntas = document.querySelectorAll("label.answer")
    for (const p of preguntas) {
        p.addEventListener("click", (event) => { validateOne(event) })
    }

    //operaciones visuales despues de tener las preguntas incorporadas 

    spinnerContainer.style.display = 'none';

    document.querySelector("input#submitAnswers").style.display = "none"

    document.querySelector("#Q0").toggleAttribute("hidden");

    //oculto landing
    document.querySelector("section#landing-screen").toggleAttribute("hidden")
    //muestro quiz
    document.querySelector("section#quiz-screen").toggleAttribute("hidden")

}

// Funcion de generacion de rankings

async function generarRanking() {

    // Pedir los datos a la database
    const q = query(collection(db, "users"), orderBy("score", "desc"));
    const querySnapshot = await getDocs(q);

    // console.log(querySnapshot)

    //Inicializar tabla
    let tabla = `<p class="cerrar-ventana">X</p>
                <h3>RANKINGS</h3>
                <table>
                <tr>
                    <th>NICK</th>
                    <th>T</th>
                    <th>D</th>
                    <th>SCORE</th>`;
    // Pintar nick y score
    querySnapshot.forEach((doc) => {
        //console.log(doc.data().nick, doc.data().score);
        tabla += `<tr>
                    <td>${doc.data().nick}</td>
                    <td>${doc.data().category}</td>
                    <td>${doc.data().difficulty}</td>
                    <td>${doc.data().score}</td>
                </tr>`
    });

    tabla += `    </tr>
                </table>
                <button id="mostrar-grafica" class="pixel2">Ver gráfica</button>`;

    //  Mostrar el ranking
    document.querySelector("section#ranking-screen").innerHTML = tabla;
    document.querySelector("section#ranking-screen").toggleAttribute("hidden");

    //Cerrar ranking
    document.querySelectorAll(".cerrar-ventana")[0].addEventListener("click", function () {
        document.querySelector("section#ranking-screen").toggleAttribute("hidden");
    })

    // Mostrar la gráfica
    document.getElementById("mostrar-grafica").addEventListener("click", function () {
        aniadirChart();
        document.getElementById("barchart-screen").toggleAttribute("hidden");
    })
}

async function aniadirChart() {

    // Pedir los datos a la database
    const q = query(collection(db, "users"), orderBy("score"));
    const querySnapshot = await getDocs(q);

    let chartlist = '<div class="ct-chart ct-perfect-fourth"></div>';
    document.querySelector("section#barchart-screen").innerHTML += chartlist;

    // collect data for chartist
    let charlistData = { labels: [], series: [[]] }

    let options = {
        axisX: {
            showLabel: true,
            labelInterpolationFnc: function (value) {
                return value.slice(0, 3);
            }
        },
        axisY: {
            onlyInteger: true
        }
    }

    querySnapshot.forEach((doc) => {
        charlistData.labels.push(doc.data().nick)
        charlistData.series[0].push(doc.data().score)
    });

    new Chartist.Bar('.ct-chart', charlistData, options);

    // Cerrar gráfica
    document.querySelector("#cerrar-barras").addEventListener("click", function () {
        document.querySelector("#barchart-screen").toggleAttribute("hidden");
    })
}


// ------ events -------

document.getElementById("ranking-btn").addEventListener("click", () => {
    generarRanking()
    // aniadirChart()
})

// main event , entry point

window.addEventListener("load", () => {

    //start click
    document.querySelector("button.quiz-start-btn")
        .addEventListener("click", start)

    document.querySelector("#home-btn")
        .addEventListener("click", reset)


})
