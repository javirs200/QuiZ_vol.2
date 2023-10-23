/*SPA aplication all in one*/
//global variables
const questionsApiUrl = "https://opentdb.com/api.php?amount=10&difficulty=easy&type=multiple"

let questionsBatch = {}

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
    for (const questionObjet of questions.results) {
        let q = JSON.stringify(apiQuestion.question)
        contentHtml = `<fieldset class="contenedor-pregunta"><legend>${q}</legend>`

        //necesito una funcion que asigne esas lineas en orden aleatorio
        contentHtml += generateRandomOrderHtml(questionObjet)

        contentHtml += '</fieldset>'

    }
    contentHtml += "</form>"
    section.innerHTML += contentHtml;
}

//---- listeners ----

//funcion para pasar al quiz
async function start() {


    //aqui se hace una llamada a api
    questionsBatch = await callApi()
    generateQuiz(questionsBatch)

    //operaciones visuales despues de tener las preguntas incorporadas 

    //oculto landing
    document.querySelector("section#landing-screen").setAttribute("hidden", "")
    //muestro quiz
    document.querySelector("section#quiz-screen").removeAttribute("hidden")

}

// ------ events -------

window.addEventListener("load", () => {

    //start click
    document.querySelector("input#quiz-start-btn")
        .addEventListener("click", () => {
            start()
        })


})