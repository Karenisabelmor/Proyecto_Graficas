function jumpToIndex(){
    window.location.href = "index.html";
}

const button = document.getElementById("backToMenu")
button.addEventListener('click', event => {
    jumpToIndex()  
})


const form = document.getElementById("configuracion")
form.addEventListener('submit', event => {
    if(event.target[0].value == ''){
        alert('Dificultad no valida')
    } else {
        let configuracion = {
            dificultad: parseInt(event.target[0].value),
            volumen: parseInt(event.target[1].value)
        }
            window.localStorage.setItem('configuracion', JSON.stringify(configuracion) )  
            alert('Tu configuracion fue guardada')
    }
})