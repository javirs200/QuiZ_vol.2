/*SPA aplication all in one*/
//global variables
const questionsApiUrl = "https://opentdb.com/api.php?amount=10&difficulty=easy&type=multiple"

let questionsBatch = {}

//for iteration between screens
let actualQuestion = 0

let miForm;

//---- aux --------

//api call obtengo batch de preguntas
async function callApi() {

    return await fetch(questionsApiUrl)
        .then(res => res.json())
        .then((data) => {
            return data;
        })
        .catch((error) => console.error("Error calling to api: ", error));//si llega aqui pasa algo con la api
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
        tmpHtml += `<label for='${JSON.stringify(answer)}' onclick='validateOne()'>${JSON.stringify(answer)}</label>
        <input type='radio' name='${JSON.stringify(answer)}' id='${JSON.stringify(answer)}' hidden></input>`;
    });

    return tmpHtml;
}

function generateQuiz(questions) {
    let section = document.querySelector("section#quiz-screen")
    let contentHtml = "<form>"
    let cont = 0
    for (const questionObjet of questions.results) {
        let q = JSON.stringify(questionObjet.question)
        contentHtml += `<fieldset class="contenedor-pregunta" id='Q${cont}' hidden><legend>${q}</legend>`

        //necesito una funcion que asigne esas lineas en orden aleatorio
        contentHtml += generateRandomOrderHtml(questionObjet)

        contentHtml += '</fieldset>'
        cont++
    }
    contentHtml += `<input type='submit' class="pixel2" hidden>`
    contentHtml += "</form>"
    section.innerHTML += contentHtml;
}

//---- listeners ----

function validateQuiz() {
    event.preventDefault();
    console.log(event.target);
}



function validateOne() {
    console.log(event.target);
    console.log(questionsBatch);
    let parentFieldset = event.target.parentElement
    let input = event.target.nextSibling
    let v = input.value
    if(v){
        parentFieldset.style.borderColor = "green"
    }else{
        parentFieldset.style.borderColor = "red"
    }

  setTimeout(nextQuestion,1500)
    
}

function nextQuestion() {

    console.log(actualQuestion);

    document.querySelector("#Q" + actualQuestion+"").setAttribute("hidden", "")

    if(actualQuestion+1 < 9){
        document.querySelector("#Q" + (actualQuestion+1)+"").removeAttribute("hidden")
    }
    actualQuestion++

}

//funcion para pasar al quiz
async function start() {

    //aqui se hace una llamada a api
    questionsBatch = await callApi()
    generateQuiz(questionsBatch)

    miForm = document.querySelector("form")

    miForm.children[0].removeAttribute("hidden")

    miForm.addEventListener('submit', validateQuiz)

    //operaciones visuales despues de tener las preguntas incorporadas 

    //oculto landing
    document.querySelector("section#landing-screen").setAttribute("hidden", "")
    //muestro quiz
    document.querySelector("section#quiz-screen").removeAttribute("hidden")

}

// ------ events -------

window.addEventListener("load", () => {

    //start click
    document.querySelector("button.quiz-start-btn")
        .addEventListener("click", () => {
            start()
        })


})