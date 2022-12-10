const coordinateTxt = document.getElementById("info");
const guessesLeft = document.getElementById("guesses");
const formTip = document.getElementById("formtip");
const ulAttempts = document.getElementById("attempts");
const formResponse = document.getElementById("userinput");
const canvas = document.getElementById("image");
const selector = document.getElementById("preview");
const imgCtx = canvas.getContext("2d");
const ctx = selector.getContext("2d");


function onSiteLoaded() {
	// Stores necessary site elements
	const Elements = {
		coordinateTxt: document.getElementById("info"),
		guessesLeft: document.getElementById("guesses"),
		formTip: document.getElementById("formtip"),
		ulAttempts: document.getElementById("attempts"),
		formResponse: document.getElementById("userinput"),
		imgCanvas: document.getElementById("image"),
		inputCanvas: document.getElementById("preview"),
	}
	Elements.imgCtx = Elements.imgCanvas.getContext("2d");
	Elements.inputCtx = Elements.inputCanvas.getContext("2d");


}

document.addEventListener("DOMContentLoaded", onSiteLoaded);

// Game data object class
// (Can get cached)
const Game = (imageSrc, answer, prevScale, attempts) => {
	// Constant game data
	this.imageSrc = imageSrc;
	this.answer = answer;
	this.prevScale = prevScale;

	// Mutatable data
	this.complete = false;
	this.attemptsLeft = attempts;
	this.guesses = []; // String of guesses
	this.regions = []; // X/Y 2-index arrays for position
}

// Object class contains info about game input
const Session = () => {	
	this.selectVisibility = false;
	this.selectable = true;
	
	this.imgSizeX;
	this.imgSizeY;
	this.prevX;
	this.prevY;
	this.sX;
	this.sY;
	this.ratio;
	this.mouseX;
	this.mouseY;
}

function createGame(imageSrc, answer, prevScale, attempts) {

}


// Initializes selected areas array
let selectVisiblity = false;
let selectable = true;
let game = true;

const defAttempts = 5;
const defTipSize = 20;
const defSelectSize = 5;

let attempts = defAttempts;
guessesLeft.innerHTML = "Tries left: " + attempts;

// Declares scale of selection preview
const scale = 0.15;

// Initializes image object and assigns source url
let img = new Image();
img.src = "https://i.insider.com/5484d9d1eab8ea3017b17e29?width=600&format=jpeg&auto=webp";

let answer = "dog";
let correct = "#4beb53";
let incorrect = "#eb5b4b";

// Gets response and creates gues
let regions = [];

// Initializes imgSize, imgSizeY, prevX, prevY, sX, sY
let imgSizeX, imgSizeY, prevX, prevY, sX, sY, element, ratio, mouseX, mouseY;

function drawFullImage() {
	ctx.clearRect(0, 0, selector.width, selector.height)
	imgCtx.clearRect(0, 0, canvas.width, canvas.height);
	imgCtx.drawImage(img, 0, 0);
}

// Submits attempts
function submit() {
	let newResponse = formResponse.value;

	if (newResponse) {
		const newElement = document.createElement("li");
		
		if (newResponse === answer) {
			attempts--;
			selectable = false;
			selectVisiblity = false;
			drawFullImage();
			newElement.style.color = "green";
			game = false;
			formResponse.disabled = true;
			guessesLeft.innerHTML = "Guessed in " + (defAttempts - attempts) + " tries!";
		} else {
			attempts--;
			newElement.style.color = "red";
			selectable = true;
			guessesLeft.innerHTML = "Tries left: " + attempts;
		}

		newElement.append(newResponse);
		ulAttempts.append(newElement);
		formResponse.value = null;
		formTip.innerHTML = null;

		if (attempts <= 0 && game === true) {
			const correctAnswer = document.createElement("li");
			correctAnswer.append(answer);
			ulAttempts.append(correctAnswer);
			correctAnswer.style.color = "gold";
			selectable = false;
			selectVisiblity = false;
			drawFullImage();
			game = false;
			formResponse.disabled = true;
		}
		
	}

}

// Draws the image to canvas
function setupImg() {
	// Gets height and width of loaded image
	const h = img.naturalHeight;
	const w = img.naturalWidth;

	imgSizeX = w;
	imgSizeY = h;
	canvas.height = h;
	canvas.width = w;

	// Very bad vertical image fix
	if (w > h) {
		canvas.style.width = "75%";
	} else {
		canvas.style.width = "55%";
	}

	//canvas.style.width = 75-((Math.min(h,w)/Math.max(h,w))*25) + "%"

	const canvasComputeStyle = window.getComputedStyle(canvas);
	const cWidth = parseInt(canvasComputeStyle.getPropertyValue('width'));
	const cHeight = parseInt(canvasComputeStyle.getPropertyValue('height'));
	ratio = imgSizeX/cWidth;

	prevX = (w * scale) / ratio;
	prevY = (h * scale) / ratio;

	selector.width = cWidth;
	selector.height = cHeight;

	coordinateTxt.innerHTML = `Image Size: (${imgSizeX}x${imgSizeY})`;

	selector.addEventListener("mousemove", updateMousePos);
	selector.addEventListener("click", createNewRegion);
	selector.addEventListener("mouseleave", updateSelect);
	selector.addEventListener("mouseenter", updateSelect);
}

// Draws selected regions of image to canvas
// Function only required for initial page loading
function drawRegions() {
	for (let i = 0; i < regions.length; i++) {
		const regionX = regions[i][0];
		const regionY = regions[i][1];
		ctx.drawImage(img, regionX, regionY, prevX, prevY, regionX, regionY, prevX, prevY);
	}
}

// Updates the canvas upon user input
function updateCanvas() {
	if (game) {
			// Gets coordinate of selection preview (countering mouse and canvas offsets)
			const canvasComputeStyle = window.getComputedStyle(canvas);
			const cWidth = parseInt(canvasComputeStyle.getPropertyValue('width'));
			const cHeight = parseInt(canvasComputeStyle.getPropertyValue('height'));
			selector.width = cWidth;
			selector.height = cHeight;
			prevX = cWidth * scale;
			prevY = cHeight * scale;
			ratio = imgSizeX/cWidth;

			ctx.clearRect(0, 0, selector.width, selector.height);

			if (regions.length === 0) {
				ctx.font = (cWidth / 25) + "px Arial";
				ctx.fillStyle = "white";
				ctx.textAlign = "center";
				ctx.fillText("Select a region of the picture to reveal", cWidth/2, cHeight/2);
			}
	
			//sX = (mouseX * ratio) - (prevX / 2);
			//sY = (mouseY * ratio) -  (prevY / 2);

			sX = mouseX - (prevX / 2);
			sY = mouseY - (prevY / 2);
	
			// Conditionals prevent region from exceeding canvas boundaries
			if (sX < 1) {
				sX = 0;
			} else if ((sX + prevX) > cWidth) {
				sX = cWidth - prevX;
			}
			
			if (sY < 1) {
				sY = 0;
			} else if ((sY + prevY) > cHeight) {
				sY = cHeight - prevY;
			}
	
			// Renders selection preview
			if (selectVisiblity && selectable) {
				ctx.beginPath();
				ctx.rect(sX, sY, prevX, prevY);
				ctx.strokeStyle = "white";
				ctx.lineWidth = defSelectSize;
				ctx.stroke();	
				coordinateTxt.innerHTML = `Image Size: (${imgSizeX}x${imgSizeY}) Selection: (${Math.floor(sX*ratio)}, ${Math.floor(sY*ratio)})`;
			} else {
				coordinateTxt.innerHTML = `Image Size: (${imgSizeX}x${imgSizeY})`;
		}
	}
	window.requestAnimationFrame(updateCanvas);
}

// Adds new image region to data and updates canvas
function createNewRegion(event) {
	if (selectable) {
		const scaledX = sX * ratio;
		const scaledY = sY * ratio;
		const scaledPrevX = prevX * ratio;
		const scaledPrevY = prevY * ratio;
		imgCtx.drawImage(img, scaledX, scaledY, scaledPrevX, scaledPrevY, scaledX, scaledY, scaledPrevX, scaledPrevY);
		regions.push([sX, sY]);
		formResponse.focus();
		selectable = false;
		updateCanvas(event);
		formTip.innerHTML = "Make a guess to reveal more of the picture";
	}
}

function updateSelect() {
	if (selectVisiblity) {
		selectVisiblity = false;
		updateCanvas();
	} else {
		selectVisiblity = true;
		updateCanvas();
	}
}

function updateMousePos(event) {
	mouseX = event.offsetX;
	mouseY = event.offsetY
}

window.requestAnimationFrame(updateCanvas);

img.onload = setupImg