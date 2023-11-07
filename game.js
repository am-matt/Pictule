var currentGame;
var currentSession;
var retrievedFromCookie = false;

// for debugging (REMOVE AFTER)
const saveCookies = false;

const defaultParams = {
	prevScale: 0.15,
	attempts: 5,
	selectSize: 5
}

// Animations
const newEntryAnimation = [
	{ transform: "translateY(-50px)", opacity: 0.0, scale: 0.25 },
	{ transform: "translateY(0px)", opacity: 1.0, scale: 1 },
];

const newEntryTiming = {
	duration: 400,
	iterations: 1,
	easing: "cubic-bezier(0, 1, 1, 1)"
};

const newEntryAdjustAnimation = [
	{ transform: "translateY(-50px)" },
	{ transform: "translateY(0px" }
]

const shinyEffectAnimation = [
	{ backgroundPosition: "300px" }
];

const shinyEffectTiming = {
	duration: 800,
	iterations: 1,
	delay: 25,
	easing: "ease-in-out"
}

// Game data object class
// (Cookie data)
function Game(imageSrc, answer, prevScale, attempts) {
	// Constant game data
	this.imageSrc = imageSrc,
	this.answer = answer,
	this.prevScale = prevScale,

	// Mutatable data
	this.complete = false,
	this.revealed = false,
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

function $(id) { return document.getElementById(id); }
function onSiteLoaded() {

	// Stores necessary site elements
	const Elements = {
		coordinateTxt: $("info"),
		guessesLeft: $("guesses"),
		formTip: $("formtip"),
		ulAttempts: $("attempts"),
		form: $("form"),
		formResponse: $("userinput"),
		imgCanvas: $("image"),
		inputCanvas: $("preview"),
	}
	Elements.imgCtx = Elements.imgCanvas.getContext("2d", { alpha: false });
	Elements.inputCtx = Elements.inputCanvas.getContext("2d");

	// TEST PURPOSES (WILL BE REPLACED IN THE FUTURE):
	const imgSrc = "https://i.insider.com/5484d9d1eab8ea3017b17e29?width=600&format=jpeg&auto=webp";
	const answer = "dog";
	const prevScale = defaultParams.prevScale; // Default parameter
	const attempts = defaultParams.attempts; // Default paramter

	// Get cookie data
	var result = document.cookie.match(new RegExp('saved=([^;]+)'));
	result && (result = JSON.parse(result[1]));

	var game;
	if (result != null) {
		game = result;
		retrievedFromCookie = true;
	} else {
		game = new Game(imgSrc, answer, prevScale, attempts);
	}

	currentGame = game;
	createSession(game, Elements);
}

function createSession(GameObj, ElementsObj) {
	const game = GameObj;
	const elements = ElementsObj;
	const session = new Session(elements);
	currentSession = session;
	
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

	// Temporary vertical image fix
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
	elements.guessesLeft.innerHTML = game.attemptsLeft;

	// Listeners
	elements.inputCanvas.addEventListener("mousemove", (e) => updateMousePos(e, session));
	elements.inputCanvas.addEventListener("click", () => createNewRegion(game, session, elements));
	elements.inputCanvas.addEventListener("mouseleave", () => updateSelect(game, session, elements));
	elements.inputCanvas.addEventListener("mouseenter", () => updateSelect(game, session, elements));
	elements.form.addEventListener("submit", (e) => onGuess(e, game, session, elements));

	window.requestAnimationFrame(() => updateCanvas(game, session, elements));

	if (retrievedFromCookie) {
		reloadFromCookie(game, session, elements)
	}
}

function reloadFromCookie(game, session, elements) {
	redrawRegions(game, session, elements);
	for (let i = 0; i < game.guesses.length; i++) {
		addEntry(game.guesses[i], "red", elements);
	}
	elements.guessesLeft.innerHTML = game.attemptsLeft;

	if (game.complete) {
		session.selectable = false;
		elements.formResponse.disabled = true;
	}
	if (game.revealed) {
		drawFullImage(elements, session);
		addEntry(game.answer, "gold", elements);
	}

	if (game.attemptsLeft == 1) {
		elements.guessesLeft.classList.add("danger");
	}
}

function drawFullImage(elements, session) {
	elements.inputCtx.clearRect(0, 0, elements.inputCanvas.width, elements.inputCanvas.height)
	elements.imgCtx.clearRect(0, 0, elements.imgCanvas.width, elements.imgCanvas.height);
	elements.imgCtx.drawImage(session.img, 0, 0);
}

function onGuess(event, game, session, elements) {
	event.preventDefault();
	const newResponse = elements.formResponse.value;
	game.guesses.push(newResponse);

	if (newResponse) {		
		if (newResponse === game.answer) {
			game.attemptsLeft--;
			elements.guessesLeft.classList.remove("danger");
			session.selectable = false;
			session.selectVisiblity = false;
			drawFullImage(elements, session);
			addEntry(newResponse, "green", elements);
			game.complete = true;
			game.revealed = true;
			elements.formResponse.disabled = true;
			elements.guessesLeft.innerHTML = games.attemptsLeft;
		} else {
			game.attemptsLeft--;
			if (game.attemptsLeft == 1) {
				elements.guessesLeft.classList.add("danger");
			}
			addEntry(newResponse, "red", elements);
			session.selectable = true;
			elements.guessesLeft.innerHTML = game.attemptsLeft;
			//saveState(game);
		}

		if (game.attemptsLeft <= 0) {
			elements.guessesLeft.classList.remove("danger");
			game.complete = true;
			session.selectable = false;
			elements.formResponse.disabled = true;
			//saveState(null);
			/*const correctAnswer = document.createElement("li");
			correctAnswer.append(game.answer);
			correctAnswer.style.color = "gold";
			elements.ulAttempts.append(correctAnswer);
			session.selectable = false;
			session.selectVisiblity = false;
			drawFullImage(elements, session);
			
			elements.formResponse.disabled = true;*/
		}
	}
	saveState(game);
}

// Adds entry to list
function addEntry(value, color, elements) {
	const newElement = document.createElement("li");
	newElement.append(value);
	newElement.style.color = color;
	newElement.animate(newEntryAnimation, newEntryTiming);
	newElement.animate(shinyEffectAnimation, shinyEffectTiming);
	
	
	elements.ulAttempts.append(newElement);
	elements.formResponse.value = null;
	elements.formTip.innerHTML = null;

	for (const li of elements.ulAttempts.children) {
		if (li != newElement) {
			li.animate(newEntryAdjustAnimation, newEntryTiming);
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
		const scaledX =  session.sX * session.ratio;
		const scaledY = session.sY * session.ratio;
		drawRegion(scaledX, scaledY, game, session, elements)
		game.regions.push([scaledX, scaledY, 0.0]);
		elements.formResponse.focus();
		session.selectable = false;
		updateCanvas(game, session, elements);
		elements.formTip.innerHTML = "Make a guess to reveal more of the picture";
		saveState(game);
	} else if (game.complete && !game.revealed) {
		game.revealed = true;
		drawFullImage(elements, session);
		addEntry(game.answer, "gold", elements);
		saveState(game);
	}
}

function drawRegion(x, y, game, session, elements) {
	const scaledPrevX = session.prevX * session.ratio;
	const scaledPrevY = session.prevY * session.ratio;
	elements.imgCtx.drawImage(session.img, x, y, scaledPrevX, scaledPrevY, x, y, scaledPrevX, scaledPrevY);
	updateCanvas(game, session, elements);
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

lastRefresh = performance.now()
// Updates the canvas upon user input
function updateCanvas(game, session, elements) {
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

	// Renders region animation to live canvas (if applicable)
	for (let i = 0; i < game.regions.length; i++) {
		if (game.regions[i][2] < 1.0) {
			if (game.regions[i][2] == 0) {
				game.regions[i][3] = performance.now();
			}
			game.regions[i][2] += (0.05) * ((performance.now() - lastRefresh) * 0.06); // every frame opacity changes 0.01
			opacity = (1 - Math.pow(game.regions[i][2], 4)); // opacity changes exponentially
			elements.inputCtx.fillStyle = "rgba(255,255,255,"+opacity+")";
			elements.inputCtx.fillRect(game.regions[i][0] / session.ratio, game.regions[i][1] / session.ratio, session.prevX, session.prevY);
			if (game.regions[i][2] >= 1.0) {
				console.log("Region " + i + " completed in " + (performance.now() - game.regions[i][3]) + " ms");
			}
		}
	}

	if (!game.complete) {
		if (game.regions.length === 0) {
			elements.inputCtx.font = (cWidth / 25) + "px Arial";
			elements.inputCtx.fillStyle = "white";
			elements.inputCtx.textAlign = "center";
			elements.inputCtx.fillText("Select a region of the picture to reveal", cWidth/2, cHeight/2);
		}
		session.sX = session.mouseX - (session.prevX / 2);
		session.sY = session.mouseY - (session.prevY / 2);

		// Prevents region from exceeding canvas boundaries
		if (session.sX < 1) {
			session.sX = 0;
		} else if ((session.sX + session.prevX) > cWidth) {
			session.sX = (cWidth - session.prevX);
		}
		
		if (session.sY < 1) {
			session.sY = 0;
		} else if ((session.sY + session.prevY) > cHeight) {
			session.sY = (cHeight - session.prevY);
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
	} else {
		if (!game.revealed) {
			elements.inputCtx.fillStyle = "rgba(0, 0, 0, 0.5)";
			elements.inputCtx.fillRect(1, 1, cWidth, cHeight);

			elements.inputCtx.font = (cWidth / 25) + "px Arial";
			elements.inputCtx.fillStyle = "red";
			elements.inputCtx.textAlign = "center";
			elements.inputCtx.fillText("Game Over!", cWidth/2, cHeight/2);
			elements.inputCtx.fillStyle = "white";
			elements.inputCtx.fillText("Click to reveal answer", cWidth/2, (cHeight/2) + ((cWidth/25)+5));
		}
		
	}
	
	lastRefresh = performance.now();
	window.requestAnimationFrame(() => updateCanvas(game, session, elements));
}	

// Save system
function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function saveState(game) {
	if (saveCookies) {
		setCookie('saved', JSON.stringify(game), 1)
	}
}

/* TO BE IMPLEMENTED LATER:
// Draws selected regions of image to canvas
// Function only required for initial page loading*/
function redrawRegions(game, session, elements) {
	for (let i = 0; i < game.regions.length; i++) {
		const regionX = game.regions[i][0];
		const regionY = game.regions[i][1];
		drawRegion(regionX, regionY, game, session, elements)
	}
}



document.addEventListener("DOMContentLoaded", onSiteLoaded);