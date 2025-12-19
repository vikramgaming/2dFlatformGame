import { VirtualJoystick as Joystick } from "./module/Controller.js";
import { Entity, collision } from "./module/Game.js";
import { image, onProgressAll } from "./module/Assets.js";
import { Canvas2D } from "./module/Draw.js";

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas");
canvas.width = innerWidth;
canvas.height = innerHeight;
const ctx = canvas.getContext("2d");
console.log(innerWidth, innerHeight);

const game = new Canvas2D(ctx);
const joystick = new Joystick(canvas, canvas.width * 0.2, canvas.height * 0.85);
const player = new Entity(
	"player",
	canvas.width / 2,
	0,
	40,
	40,
	image("./character/idle.png"),
	image([
		"./character/idle.png",
		"./character/walk1.png",
		"./character/idle.png",
		"./character/walk2.png",
	])
);
const camera = { x: 0, y: 0 };
let stage = 1;
let nextStage = true;

const gravity = 0.5;
const world = 3;
const ground = canvas.height - 120;
let background = [];
let decoration = [];
changeBg(
	image("./background/grass.png"),
	image(["./background/tree1.png", "./background/tree2.png"])
);

const enemyImage = {
    
}
let enemy = [];

function update() {
	const maxWorld = canvas.width * world - world;
	camera.x = player.x - canvas.width / 2 + player.width / 2;
	camera.x = Math.max(0, Math.min(camera.x, maxWorld - canvas.width));

	const move = joystick.getVector().mul(3);

	let prevX = player.x;
	let prevY = player.y;
	if (joystick.direction !== "none") player.facingLeft = move.x < 0;

	player.x += move.x;
	if (player.x < 0) player.x = 0;
	if (player.x + player.width >= maxWorld) {
		player.x = 0;
		stage++;
		nextStage = true;
		alphaText = 1;
	}
	player.isWalking = move.x !== 0 && move.y !== 0;

	player.velocityY += gravity;

	if (
		player.isLanding &&
		joystick.direction === "up" &&
		joystick.handlePos.mag() > 30
	)
		player.velocityY = move.y * 3;

	// Collision

	let isCollidingX = false;
	let isCollidingY = false;
	let differentY = 0;

	for (const bg of background) {
		const playerHitbox = {
			x: player.x,
			y: player.y + player.velocityY,
			width: player.width,
			height: player.height,
		};

		if (!isCollidingY) isCollidingY = collision(playerHitbox, bg);

		playerHitbox.x += move.x;
		playerHitbox.y -= player.velocityY;
		if (!isCollidingX) {
			isCollidingX = collision(playerHitbox, bg);

			if (isCollidingX && player.isLanding) {
				differentY = bg.y - (player.y + player.height);
			}
		}
	}

	if (isCollidingX) {
		player.x = prevX;
		player.isWalking = false;
	}
	if (isCollidingY) {
		player.velocityY = 0;
		player.y = prevY;
		player.isLanding = true;
	} else {
		player.isLanding = false;
	}
	player.y += player.velocityY;

	// Auto Jump
	if (differentY >= -15 && differentY < 0) {
		player.x += move.x;
		player.y += differentY;
	}
}

/** @param {{x: number, width: number}} obj */
function render(obj) {
	return obj.x + obj.width > camera.x && obj.x < camera.x + canvas.width;
}

function draw() {
	// === draw entity and object ===
	ctx.save();
	ctx.translate(-camera.x, -camera.y);

	for (const bg of background) {
		if (render(bg))
			game.drawImage(bg.image, bg.x, bg.y, bg.width, bg.height);
	}

	for (const d of decoration) {
		if (render(d)) game.drawImage(d.image, d.x, d.y, d.width, d.height);
	}

	player.draw(({ name, image, x, y, width, height, facingLeft }) => {
		game.drawImage(image, x, y, width, height, facingLeft);
		game.drawText(name, x + width / 2, y, {
			color: "white",
			textAlign: "center",
		});
	}, 250);

	ctx.restore();

	// === others ===

	joystick.update();

	fps = fps.toFixed(0);
	game.drawText(`${fps} fps`, canvas.width * 0.95, 30, {
		color: fps > 20 ? (fps > 40 ? "green" : "yellow") : "red",
		font: "10px Arial",
	});
}

let lastStamp = 0;
let fps = 0;
let alphaText = 1;
function loop(timeStamp) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	let delta = 0;
	if (lastStamp) delta = timeStamp - lastStamp;
	lastStamp = timeStamp;
	fps = 1000 / delta;

	update();
	draw();

	if (nextStage) {
		alphaText -= (1 / 3000) * delta;
		alphaText = Math.max(0, alphaText);

		game.drawText(`stage ${stage}`, canvas.width / 2, canvas.height / 2, {
			color: `hsla(360, 100%, 50%, ${alphaText})`,
			font: "64px Arial",
		});
		if (alphaText === 0) nextStage = false;
	}

	requestAnimationFrame(loop);
}

window.start = function () {
	const menu = document.getElementById("menu");
	const inputEl = menu.querySelector("input");
	const input = inputEl.value.trim();

	if (input.length < 3 || input.length > 10) {
		alert("Nama pemain harus 3–10 karakter");
		inputEl.focus();
		return;
	}

	player.name = input;
	menu.style.display = "none";
	requestAnimationFrame(loop);
};

/**
 * @param {HTMLImageElement} bg
 * @param {HTMLImageElement[]} deco
 */
function changeBg(bgImg, decoImg) {
	decoration = [];
	const decoWidth = 100;
	const decoHeight = 100;

	background = [];
	const maxYbg = 20;
	const minYbg = -20;

	for (let i = 0; i < world; i++) {
		const randomYbg =
			Math.floor(Math.random() * (maxYbg - minYbg + 1)) + minYbg;
		const bg = {
			image: bgImg,
			x: canvas.width * i - i,
			y: ground + randomYbg,
			width: canvas.width,
			height: canvas.height - ground - randomYbg,
		};
		background.push(bg);

		const randomChoice = Math.floor(Math.random() * decoImg.length);
		const randomXdeco =
			Math.floor(
				Math.random() * (bg.x + bg.width - decoWidth - bg.x + 1)
			) + bg.x;

		const deco = {
			image: decoImg[randomChoice],
			x: randomXdeco,
			y: bg.y - decoWidth,
			width: decoWidth,
			height: decoHeight,
		};
		decoration.push(deco);
	}
}

!(function () {
	const fullScreen = document.getElementById("fullScreen");
	let access = false;

	fullScreen.addEventListener("click", () => {
		if (!access) {
			if (confirm("performa mungkin akan menurun, kamu yakin?")) {
				access = true;
			} else {
				return;
			}
		}

		const elem = document.documentElement;
		if (elem.requestFullscreen) {
			elem.requestFullscreen();
		} else if (elem.webkitRequestFullscreen) {
			elem.webkitRequestFullscreen();
		} else if (elem.msRequestFullscreen) {
			elem.msRequestFullscreen();
		}

		onProgressAll(() => {
			fullScreen.style.display = "none";
		});
	});

	document.addEventListener("fullscreenchange", () => {
		if (!document.fullscreenElement) {
			fullScreen.style.display = "block";
		}
	});
	onProgressAll(() => {
		fullScreen.style.display = "block";
	});
})();
