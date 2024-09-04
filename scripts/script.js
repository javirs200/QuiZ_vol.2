/*SPA aplication all in one*/

const parser = new DOMParser()

// Importar las funciones
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-app.js";
// import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-auth.js";
import { getFirestore, collection, query, where, doc, addDoc, getDoc, getDocs, orderBy, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-firestore.js";

// Configuración de la app web 
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

// Selectores
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById('login-form');
const errMsg = document.querySelectorAll('.msgerr');
const errMsgPass = document.querySelector('.msgerr-pass');
const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
const passRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/
const submitBtn = document.querySelector("input#submitAnswers");
const spinnerContainer = document.getElementById('spinnerContainer');
const loadingTips = document.getElementById('loadingTips');

//global variables
const numQuestions = 10;
const questionsApiUrl = `https://opentdb.com/api.php?amount=${numQuestions}&category=31&difficulty=easy&type=multiple`

const loadingMessages = ["Cargando preguntas...",
    "Traduciendo preguntas...",
    "Cargando interfaz...",
    "Limpiando Registro...",
    "Matando Demonios...",
    "Cargando efectos Espaciales...",
    "Arrancando Central Nucelar...",
    "Cargando..."];

let questionsBatch = {}

//for iteration between screens
let actualQuestion = 0;

let validated = -1;

let score = 0;

//---- aux --------

async function sendAndReset(event) {
    event.preventDefault();
    let nick = event.target.querySelector("input#nick").value
    // datos para enviar
    let data = { nick: nick, score: score }
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

//api call obtengo batch de preguntas
async function callApi() {

    return await fetch(questionsApiUrl)
        .then(res => res.json())
        .then((data) => {
            return data;
        })
        .catch((error) => console.error("Error calling to api: ", error));//si llega aqui pasa algo con la api
}

async function translateQuestions(questionObjet) {

    // console.log(questionObjet)

    let q = questionObjet.question
    let a = questionObjet.correct_answer
    let i = questionObjet.incorrect_answers.slice().reduce((acc, curr, i) => {
        if (i < 2) {
            return acc + curr + "|"
        } else {
            return acc + curr
        }
    }, "")

    let all = q + "|" + a + "|" + i

    let parsed = parser.parseFromString(all, "text/html").body.textContent

    // console.log(parsed);

    // llamada a la api de traduccion
    let url = `https://api.mymemory.translated.net/get?q=${parsed}&langpair=en|es&de=fordrsmax@gmail.com`
    try {
        let res = await fetch(url)
        await res.json().then(data => {

            // volver a guardar las preguntas traducidas en el objeto
            let array = data.responseData.translatedText.split("|")

            // console.log(array);

            if (array.length != 5) {
                console.log("Error en la traduccion")
            } else {
                questionObjet.question = array[0]
                questionObjet.correct_answer = array[1]
                questionObjet.incorrect_answers = [array[2], array[3], array[4]]
                // console.log(questionObjet)
            }

        })
    } catch (error) {
        console.log("Error en la traduccion")
    }
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

async function generateQuiz(questions) {
    let section = document.querySelector("section#quiz-screen")
    let contentHtml = `<form id="quizform">`
    let cont = 0
    for (const questionObjet of questions.results) {

        await translateQuestions(questionObjet)

        let q = questionObjet.question
        contentHtml += `<fieldset class="contenedor-pregunta" id='Q${cont}' hidden><legend>${q}</legend>`

        //necesito una funcion que asigne esas lineas en orden aleatorio
        contentHtml += generateRandomOrderHtml(questionObjet)

        contentHtml += '</fieldset>'
        cont++
    }
    contentHtml += `<input id='submitAnswers' type='submit' class='pixel2' value='Enviar y Ver Resultados'></input>`
    contentHtml += "</form>"
    section.innerHTML += contentHtml;

    document.querySelector("#quizform").addEventListener("submit", validateQuiz)
}

// Validación de quiz - Almacenar score en Firestore
// submitBtn.addEventListener("submit", validateQuiz)

function validateQuiz(event) {
    event.preventDefault();
    // console.log(event.target);

    // pedir el nickname para asignar el score
    let contentHtml = `<form id="resultForm">`

    contentHtml += `<h3>Tu puntuación final es...</h3>
                    <h3 id="score"> ${score} / 10</h3>
                    <label for="nick">Introduce tu nickname:</label>
                    <input type="text" id="nick" name="nick" class="login-input" required>
                    <p class="msg"></p>      
                    <p class="msgerr"></p>
                    <button type="submit" class="pixel2">Enviar</button>
                    </form>`

    // Pintar pantalla de resultados
    document.getElementById("results-screen").toggleAttribute("hidden");
    document.getElementById("results-screen").innerHTML = contentHtml

    document.getElementById("resultForm").addEventListener("submit", sendAndReset);
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

            // #43f343 -> verde fosforito
            let verde = '#43f343'
            let rojo = "#ff0000"
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

    //loading tips
    var loadTimer = setInterval(function () {
        let randomIndex = Math.floor(Math.random() * loadingMessages.length)
        loadingTips.innerHTML = loadingMessages[randomIndex]
    }, 500);

    //aqui se hace una llamada a api
    questionsBatch = await callApi()

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

// ------ events -------

window.addEventListener("load", () => {

    //start click
    document.querySelector("button.quiz-start-btn")
        .addEventListener("click", start)

    document.querySelector("#home-btn")
        .addEventListener("click", reset)


})

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
                    <th>SCORE</th>`;
    // Pintar nick y score
    querySnapshot.forEach((doc) => {
        //console.log(doc.data().nick, doc.data().score);
        tabla += `<tr>
                    <td>${doc.data().nick}</td>
                    <td>...${doc.data().score}</td>
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


document.getElementById("ranking-btn").addEventListener("click", () => {
    generarRanking()
    // aniadirChart()
})

