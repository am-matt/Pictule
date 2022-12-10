const defaultParams = {
	prevScale: 0.15,
	attempts: 5,
	selectSize: 5
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
	this.sX = 0,
	this.sY = 0,
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
		form: document.getElementById("form"),
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
	const h = session.img.naturalHeight;
	const w = session.img.naturalWidth;

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
	session.ratio = session.imgSizeX/cWidth;

	session.prevX = (w * game.prevScale) / session.ratio;
	session.prevY = (h * game.prevScale) / session.ratio;

	elements.inputCanvas.width = cWidth;
	elements.inputCanvas.height = cHeight;

	elements.coordinateTxt.innerHTML = `Image Size: (${session.imgSizeX}x${session.imgSizeY})`;
	elements.guessesLeft.innerHTML = "Tries left: " + game.attemptsLeft;

	elements.inputCanvas.addEventListener("mousemove", (e) => updateMousePos(e, session));
	elements.inputCanvas.addEventListener("click", () => createNewRegion(game, session, elements));
	elements.inputCanvas.addEventListener("mouseleave", () => updateSelect(game, session, elements));
	elements.inputCanvas.addEventListener("mouseenter", () => updateSelect(game, session, elements));
	elements.form.addEventListener("submit", (e) => onGuess(e, game, session, elements));

	window.requestAnimationFrame(() => updateCanvas(game, session, elements));
}

function drawFullImage(elements, session) {
	elements.inputCtx.clearRect(0, 0, elements.inputCanvas.width, elements.inputCanvas.height)
	elements.imgCtx.clearRect(0, 0, elements.imgCanvas.width, elements.imgCanvas.height);
	elements.imgCtx.drawImage(session.img, 0, 0);
}

function onGuess(event, game, session, elements) {
	event.preventDefault();
	const newResponse = elements.formResponse.value;

	if (newResponse) {
		const newElement = document.createElement("li");
		
		if (newResponse === game.answer) {
			game.attemptsLeft--;
			session.selectable = false;
			session.selectVisiblity = false;
			drawFullImage(elements, session);
			newElement.style.color = "green";
			game.complete = true;
			elements.formResponse.disabled = true;
			elements.guessesLeft.innerHTML = "Guessed in " + (defaultParams.attempts - game.attemptsLeft) + " tries!";
		} else {
			game.attemptsLeft--;
			newElement.style.color = "red";
			session.selectable = true;
			elements.guessesLeft.innerHTML = "Tries left: " + game.attemptsLeft;
		}

		newElement.append(newResponse);
		elements.ulAttempts.append(newElement);
		elements.formResponse.value = null;
		elements.formTip.innerHTML = null;

		if (game.attemptsLeft <= 0 && !game.complete) {
			const correctAnswer = document.createElement("li");
			correctAnswer.append(game.answer);
			correctAnswer.style.color = "gold";
			elements.ulAttempts.append(correctAnswer);
			session.selectable = false;
			session.selectVisiblity = false;
			drawFullImage(elements, session);
			game.complete = true;
			elements.formResponse.disabled = true;
		}	
	}

	
}

// Updates mouse vars within canvas
function updateMousePos(event, session) {
	session.mouseX = event.offsetX;
	session.mouseY = event.offsetY;
}

// Adds new image region to data and updates canvas
function createNewRegion(game, session, elements) {
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
			session.prevX = cWidth * game.prevScale;
			session.prevY = cHeight * game.prevScale;
			session.ratio = session.imgSizeX/cWidth;

			elements.inputCtx.clearRect(0, 0, elements.inputCanvas.width, elements.inputCanvas.height);

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
				elements.inputCtx.lineWidth = defaultParams.selectSize;
				elements.inputCtx.stroke();	
				elements.coordinateTxt.innerHTML = `Image Size: (${session.imgSizeX}x${session.imgSizeY}) Selection: (${Math.floor(session.sX*session.ratio)}, ${Math.floor(session.sY*session.ratio)})`;
			} else {
				elements.coordinateTxt.innerHTML = `Image Size: (${session.imgSizeX}x${session.imgSizeY})`;
		}
	}
	window.requestAnimationFrame(() => updateCanvas(game, session, elements));
}

/* TO BE IMPLEMENTED LATER:
// Draws selected regions of image to canvas
// Function only required for initial page loading
/*function drawRegions() {
	for (let i = 0; i < regions.length; i++) {
		const regionX = regions[i][0];
		const regionY = regions[i][1];
		ctx.drawImage(img, regionX, regionY, prevX, prevY, regionX, regionY, prevX, prevY);
	}
}*/

document.addEventListener("DOMContentLoaded", onSiteLoaded);