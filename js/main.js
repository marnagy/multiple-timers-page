class Timer{
    constructor(id, hours, minutes, seconds){
        this.id = id
        this.hours = hours
        this.minutes = minutes
        this.seconds = seconds
        this.miliseconds = 0

        this.enabled = true
        this.ended = false
        this.removed = false
    }
    start(){
        this.enabled = true
    }
    pause(){
        this.enabled = false
    }
    update(miliseconds) {
        if ( !this.enabled )
            return

        if ( this.hours === 0 && this.minutes === 0 &&
            this.seconds === 0 && this.miliseconds <= miliseconds ) {
            this.miliseconds = 0
            this.ended = true
            return
        }

        if ( this.miliseconds >= miliseconds ){
            this.miliseconds -= miliseconds
        }
        else {
            if ( this.seconds > 0 ) {
                this.seconds -= 1
                this.miliseconds += 1_000
            }
            else if ( this.minutes > 0 ) {
                this.minutes -= 1
                this.seconds += 60
            }
            else if ( this.hours > 0 ) {
                this.hours -= 1
                this.minutes += 60
            }
            else {
                console.log(`Error branch: ended -> ${this.ended}`)
                console.log(this)
                throw new Error("Cannot update timer no more.")
            }
            
            this.update(miliseconds)
        }

        this.ended = this.hours === 0 && this.minutes === 0 &&
            this.seconds === 0 && this.miliseconds === 0
    }
    getCurrentState() {
        return `${zeroPad(this.hours, 2)}:${zeroPad(this.minutes, 2)}:${zeroPad(this.seconds, 2)}`
    }
    createDomContainer(){
        const container = document.createElement('div')
        container.setAttribute('class', 'timer-container')
        const new_elem = document.createElement('h3')
        new_elem.innerHTML = this.getCurrentState()
        const remove_button = document.createElement('button')
        remove_button.setAttribute('class', 'remove-button')
        remove_button.textContent = 'X'
        remove_button.onclick = () => {
            remove_timer(this.id)
        }
        container.appendChild(new_elem)
        container.appendChild(remove_button)
        return container
    }
    updateContainerContent(container){
        const header = container.children[0]
        const button = container.children[1]
        const newHeader = document.createElement('h3')
        newHeader.innerHTML = this.getCurrentState()
        container.replaceChild(newHeader, header)
        button.onclick = () => remove_timer(this.id)
    }
}

const timers = new Array()
let timer_number = 0
const timers_container = document.getElementById('timers-container')
const hourElement = document.getElementById('hours-input')
const minutesElement = document.getElementById('minutes-input')
const secondsElement = document.getElementById('seconds-input')
const timerMiliseconds = 1_000
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const alarm = document.getElementById('alarm-audio')
alarm.loop = true

function zeroPad(num, places){
    return String(num).padStart(places, '0')
}

function add_timer(){
    console.log('Adding timer...')
    const hours = parseInt(hourElement.value)
    const minutes = parseInt(minutesElement.value)
    const seconds = parseInt(secondsElement.value)

    if ( hours === 0 && minutes === 0 && seconds === 0){

    }

    const timer = new Timer(timer_number++, hours, minutes, seconds)

    hourElement.value = 0
    minutesElement.value = 0
    secondsElement.value = 0

    timers.push(timer)
    // update DOM
    timers_container.appendChild( timer.createDomContainer() )
}

function update(){
    timers.forEach(timer => {
        if ( timer.removed )
            return

        timer.update(timerMiliseconds)
        
        if ( timer.ended ){
            alarm.play()
            return
        }
    })

    // if ( timers.length > 0 )
    //     console.log(JSON.stringify(timers.forEach(timer => {
    //         id: timer.id
    //         ended: timer.ended
    //     })))
    
    function combine(arr1, arr2){
        const zipped = new Array(arr1.length)
        for (let i = 0; i < arr1.length; i++) {
            if ( arr2.length <= i ){
                zipped.push( [arr1[i], undefined] )
            }
            else{
                zipped.push( [arr1[i], arr2[i]] )
            }
        }
        return zipped.reverse()
    }

    const combinedArr = combine(timers, timers_container.children)

    combinedArr.forEach(element => {
        const timer = element[0]
        const DomElem = element[1]

        if ( !DomElem ) {
            // create timer container
            timers_container.appendChild( timer.createDomContainer() )
        }
        else {
            timer.updateContainerContent(DomElem)
        }
    })
}

function remove_timer(id){
    console.log(`Removing timer with id ${id}`)
    alarm.pause()
    const index = removeElement((timer) => timer.id === id)
    if ( index >= 0 ){
        removeDomElementAt(index)
    }
}

function removeElement(func){
    let resIndex = -1
    const tempStack = new Array()
    for (let i = timers.length - 1; i >= 0 ; i--) {
        const element = timers.pop()
        // end of array
        if ( !element ){
            break
        }
        if ( func(element) ){
            console.log(`Matched on removing on index ${i}`)
            // element.pause()
            // element.removed = true
            resIndex = i
            break;
        }
        tempStack.push(element)
    }

    let element = tempStack.pop()
    while (element){
        timers.push( element )
        element = tempStack.pop()
    }
    return resIndex
}

function removeDomElementAt(index){
    const tempStack = new Array()
    let currentIndex = timers_container.children.length -1
    while (true){
        const element = timers_container.lastChild
        // end of array
        if ( !element ){
            break
        }
        timers_container.removeChild(element)
        if ( currentIndex === index ){
            break;
        }
        tempStack.push(element)
        currentIndex--
    }

    let element = tempStack.pop()
    while (element){
        timers_container.appendChild( element )
        element = tempStack.pop()
    }
}

function removeDomElementsFromEnd(amount){
    for (let i = 0; i < amount; i++) {
        const lastElem = timers_container.lastChild
        timers_container.removeChild(lastElem)
    }
}

const add_timer_button = document.getElementById('add-button')
add_timer_button.onclick = () => add_timer()

const worker = new Worker('./js/worker.js')

// update tick
worker.addEventListener('message', e => {
    update()
})

worker.postMessage('start')

//setInterval(update, timerMiliseconds);
