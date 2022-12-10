const coordinateTxt = document.getElementById("info");
const guessesLeft = document.getElementById("guesses");
const formTip = document.getElementById("formtip");
const ulAttempts = document.getElementById("attempts");
const formResponse = document.getElementById("userinput");
const canvas = document.getElementById("image");
const selector = document.getElementById("preview");
const imgCtx = canvas.getContext("2d");
const ctx = selector.getContext("2d");

const defaultParams = {
	prevScale: 0.15,
	attempts: 5
}

// Game data object class
// (Can get cached)
function Game(imageSrc, answer, prevScale, attempts) {
	// Constant game data
	this.imageSrc = imageSrc,
	this.answer = answer,
	this.prevScale = prevScale,

	// Mutatable data
	this.complete = false,
	this.attemptsLeft = attempts,
	this.guesses = [], // String of guesses
	this.regions = [] // X/Y 2-index arrays for position
}

// Object class contains info about game input
function Session(Elements) {	
	this.selectVisibility = false,
	this.selectable = true,
	this.img
	
	this.imgSizeX,
	this.imgSizeY,
	this.prevX,
	this.prevY,
	this.sX,
	this.sY,
	this.ratio,
	this.mouseX,
	this.mouseY,
	this.elements = Elements;
}

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

	// TEST PURPOSES (WILL BE REPLACED IN THE FUTURE):
	const imgSrc = "https://i.insider.com/5484d9d1eab8ea3017b17e29?width=600&format=jpeg&auto=webp";
	const answer = "dog";
	const prevScale = defaultParams.prevScale; // Default parameter
	const attempts = defaultParams.attempts; // Default paramter

	const game = new Game(imgSrc, answer, prevScale, attempts);
	createSession(game, Elements);
}

function createSession(GameObj, ElementsObj) {
	const game = GameObj;
	const elements = ElementsObj;
	const session = new Session(elements);
	
	session.img = new Image();
	session.img.src = game.imageSrc;

	session.img.onload = () => setupImg(game, session, elements);
}

// Draws the image to canvas
function setupImg(game, session, elements) {
	// Gets height and width of loaded image
	const h = img.naturalHeight;
	const w = img.naturalWidth;

	session.imgSizeX = w;
	session.imgSizeY = h;
	elements.imgCanvas.height = h;
	elements.imgCanvas.width = w;

	// Very bad vertical image fix
	if (w > h) {
		elements.imgCanvas.style.width = "75%";
	} else {
		elements.imgCanvas.style.width = "55%";
	}

	//canvas.style.width = 75-((Math.min(h,w)/Math.max(h,w))*25) + "%"

	const canvasComputeStyle = window.getComputedStyle(elements.imgCanvas);
	const cWidth = parseInt(canvasComputeStyle.getPropertyValue('width'));
	const cHeight = parseInt(canvasComputeStyle.getPropertyValue('height'));
	session.ratio = imgSizeX/cWidth;

	session.prevX = (w * session.prevScale) / ratio;
	session.prevY = (h * session.prevScale) / ratio;

	elements.inputCanvas.width = cWidth;
	elements.inputCanvas.height = cHeight;

	elements.coordinateTxt.innerHTML = `Image Size: (${imgSizeX}x${imgSizeY})`;

	elements.inputCanvas.addEventListener("mousemove", (e) => updateMousePos(e, session));
	elements.inputCanvas.addEventListener("click", (e) => createNewRegion(e, game, session, elements));
	elements.inputCanvas.addEventListener("mouseleave", () => updateSelect(game, session, elements));
	elements.inputCanvas.addEventListener("mouseenter", () => updateSelect(game, session, elements));

	window.requestAnimationFrame(() => updateCanvas(game, session, elements));
}

// Updates mouse vars within canvas
function updateMousePos(event, session) {
	session.mouseX = event.offsetX;
	session.mouseY = event.offsetY;
}

// Adds new image region to data and updates canvas
function createNewRegion(event, game, session, elements) {
	if (session.selectable) {
		const scaledX = session.sX * session.ratio;
		const scaledY = session.sY * session.ratio;
		const scaledPrevX = session.prevX * session.ratio;
		const scaledPrevY = session.prevY * session.ratio;
		elements.imgCtx.drawImage(session.img, scaledX, scaledY, scaledPrevX, scaledPrevY, scaledX, scaledY, scaledPrevX, scaledPrevY);
		game.regions.push([session.sX, session.sY]);
		elements.formResponse.focus();
		session.selectable = false;
		updateCanvas(game, session, elements);
		elements.formTip.innerHTML = "Make a guess to reveal more of the picture";
	}
}

function updateSelect(game, session, elements) {
	if (session.selectVisiblity) {
		session.selectVisiblity = false;
		updateCanvas(game, session, elements);
	} else {
		session.selectVisiblity = true;
		updateCanvas(game, session, elements);
	}
}

// Updates the canvas upon user input
function updateCanvas(game, session, elements) {
	if (!game.complete) {
			// Gets coordinate of selection preview (countering mouse and canvas offsets)
			const canvasComputeStyle = window.getComputedStyle(elements.imgCanvas);
			const cWidth = parseInt(canvasComputeStyle.getPropertyValue('width'));
			const cHeight = parseInt(canvasComputeStyle.getPropertyValue('height'));
			elements.inputCanvas.width = cWidth;
			elements.inputCanvas.height = cHeight;
			session.prevX = cWidth * scale;
			session.prevY = cHeight * scale;
			session.ratio = session.imgSizeX/cWidth;

			elements.inputCtx.clearRect(0, 0, selector.width, selector.height);

			if (game.regions.length === 0) {
				elements.inputCtx.font = (cWidth / 25) + "px Arial";
				elements.inputCtx.fillStyle = "white";
				elements.inputCtx.textAlign = "center";
				elements.inputCtx.fillText("Select a region of the picture to reveal", cWidth/2, cHeight/2);
			}

			session.sX = session.mouseX - (session.prevX / 2);
			session.sY = session.mouseY - (session.prevY / 2);
	
			// Conditionals prevent region from exceeding canvas boundaries
			if (session.sX < 1) {
				session.sX = 0;
			} else if ((session.sX + session.prevX) > cWidth) {
				session.sX = cWidth - session.prevX;
			}
			
			if (session.sY < 1) {
				session.sY = 0;
			} else if ((session.sY + session.prevY) > cHeight) {
				session.sY = cHeight - session.prevY;
			}
	
			// Renders selection preview
			if (session.selectVisiblity && session.selectable) {
				elements.inputCtx.beginPath();
				elements.inputCtx.rect(session.sX, session.sY, session.prevX, session.prevY);
				elements.inputCtx.strokeStyle = "white";
				elements.inputCtx.lineWidth = defSelectSize;
				elements.inputCtx.stroke();	
				elements.coordinateTxt.innerHTML = `Image Size: (${session.imgSizeX}x${session.imgSizeY}) Selection: (${Math.floor(session.sX*session.ratio)}, ${Math.floor(session.sY*session.ratio)})`;
			} else {
				elements.coordinateTxt.innerHTML = `Image Size: (${session.imgSizeX}x${session.imgSizeY})`;
		}
	}
	window.requestAnimationFrame(() => updateCanvas(game, session, elements));
}


// ----------------------------UNFIXED CODE BELOW------------------------------------- //

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

// Gets response and creates gues
let regions = [];

// Initializes imgSize, imgSizeY, prevX, prevY, sX, sY
let imgSizeX, imgSizeY, prevX, prevY, sX, sY, ratio, mouseX, mouseY;

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

// Draws selected regions of image to canvas
// Function only required for initial page loading
function drawRegions() {
	for (let i = 0; i < regions.length; i++) {
		const regionX = regions[i][0];
		const regionY = regions[i][1];
		ctx.drawImage(img, regionX, regionY, prevX, prevY, regionX, regionY, prevX, prevY);
	}
}

//

document.addEventListener("DOMContentLoaded", onSiteLoaded);