export class Vector {
	/**
	 * @param {number} x
	 * @param {number} y
	 */
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
	/**
	 * @param {Vector} v
	 * @returns {Vector}
	 */
	add(v) {
		return new Vector(this.x + v.x, this.y + v.y);
	}
	/**
	 * @param {Vector} v
	 * @returns {Vector}
	 */
	sub(v) {
		return new Vector(this.x - v.x, this.y - v.y);
	}
	/**
	 * @param {number} n
	 * @returns {Vector}
	 */
	mul(n) {
		return new Vector(this.x * n, this.y * n);
	}
	/**
	 * @param {number} n
	 * @returns {Vector}
	 */
	div(n) {
		return n === 0 ? new Vector(0, 0) : new Vector(this.x / n, this.y / n);
	}
	/**
	 * @returns {number}
	 */
	mag() {
		return Math.sqrt(this.x ** 2 + this.y ** 2);
	}
	/**
	 * @returns {Vector}
	 */
	normalize() {
		return this.mag() === 0 ? new Vector(0, 0) : this.div(this.mag());
	}
	/**
	 * direction to the target
	 * @param {Vector} target
	 * @returns {Vector}
	 */
	direction(target) {
		return target.sub(this).normalize();
	}
	/**
	 * get a degress
	 * @returns {number}
	 */
	angle() {
		return Math.atan2(this.y, this.x) * (180 / Math.PI);
	}
	/**
	 * distance from this object to the target
	 * @param {Vector} target
	 * @returns {number}
	 */
	distance(target) {
		return Math.sqrt((this.x - target.x) ** 2 + (this.y - target.y) ** 2);
	}
	/**
	 * limit the vector
	 * @returns {Vector}
	 */
	limit(max) {
		const m = this.mag();
		if (m > max) return this.normalize().mul(max);
		return this.clone();
	}
	/**
	 * @returns {Vector}
	 */
	clone() {
		return new Vector(this.x, this.y);
	}
}

export class Controller {
	/**
	 * @param {number} x
	 * @param {number} y
	 */
	constructor(x, y) {
		this.pos = new Vector(x, y);
	}
	/** @param {number} n */
	set x(n) {
		this.pos.x = n;
	}
	/** @param {number} n */
	set y(n) {
		this.pos.y = n;
	}
	get x() {
		return this.pos.x;
	}
	get y() {
		return this.pos.y;
	}
	/** @returns {Vector} */
	getVector() {
		return this.pos.normalize();
	}
	get direction() {
		const move = this.getVector();
		if (move.mag() === 0) return "none";
		if (Math.abs(move.x) > Math.abs(move.y)) {
			return move.x > 0 ? "right" : "left";
		} else {
			return move.y > 0 ? "down" : "up";
		}
	}
	/** @returns {boolean} */
	isMoving() {
		return this.getVector().mag() > 0;
	}
}
export class VirtualJoystick extends Controller {
	/**
	 * @param {HTMLCanvasElement} canvas
	 * @param {number} [x]
	 * @param {number} [y]
	 * @param {number} [radius]
	 * @param {number} [handleRadius]
	 */
	constructor(
		canvas,
		x = null,
		y = null,
		radius = null,
		handleRadius = null
	) {
		super(
			x ?? canvas.width / 2,
			y ?? Math.round(canvas.height - canvas.height / 5.65833333)
		);
		this.origin = new Vector(this.pos.x, this.pos.y);
		/** @type {HTMLCanvasElement} */
		this.canvas = canvas;
		/** @type {CanvasRenderingContext2D} */
		this.ctx = canvas.getContext("2d");
		this.radius =
			radius ?? Math.round((canvas.width + canvas.height) / 20.78);
		this.handleRadius = handleRadius ?? this.radius / 2;
		this.borderWidth = 1;
		this.color = "rgba(0,0,0,0)";
		this.handleColor = "#3d3d3d";
		this.borderColor = this.handleColor;
		this.handleFriction = 0.25;
		this.deadZone = 0.15;
		this.touchPos = new Vector(this.pos.x, this.pos.y);
		this.ondrag = false;
		this.touchId = null;

		/** @type {(vector: Vector, touchPos: Vector) => void | null} */
		this.onStart = null;

		/** @type {(vector: Vector, touchPos: Vector) => void | null} */
		this.onMove = null;

		/** @type {(vector: Vector, touchPos: Vector) => void | null} */
		this.onEnd = null;

		/** @private */
		this._onStart = this._onStart.bind(this);

		/** @private */
		this._onMove = this._onMove.bind(this);

		/** @private */
		this._onEnd = this._onEnd.bind(this);

		/** @private */
		this._listening = false;
		this._listener();
	}
	/** @private */
	_listener() {
		if (this._listening) return;
		this._listening = true;
		this.canvas.addEventListener("touchstart", this._onStart);
		this.canvas.addEventListener("touchmove", this._onMove, {
			passive: false,
		});
		this.canvas.addEventListener("touchend", this._onEnd);
	}
	/** @private @param {TouchEvent} e */
	_onStart(e) {
		for (let touch of e.changedTouches) {
			const pos = this._getTouchPos(touch);
			if (
				pos.sub(this.origin).mag() <= this.radius &&
				this.touchId === null
			) {
				this.touchId = touch.identifier;
				this.touchPos = pos;
				this.ondrag = true;
			}
		}
		try {
			this.onStart?.(this.getVector(), this.touchPos);
		} catch {}
	}
	/** @private @param {TouchEvent} e */
	_onMove(e) {
		for (let touch of e.changedTouches) {
			if (touch.identifier === this.touchId) {
				this.touchPos = this._getTouchPos(touch);
			}
		}
		try {
			this.onMove?.(this.getVector(), this.touchPos);
		} catch {}
	}
	/** @private @param {TouchEvent} e */
	_onEnd(e) {
		for (let touch of e.changedTouches) {
			if (touch.identifier === this.touchId) {
				this.touchId = null;
				this.ondrag = false;
			}
		}
		try {
			this.onEnd?.(this.getVector(), this.touchPos);
		} catch {}
	}
	/**
	 * @private
	 * @param {Touch} touch
	 * @returns {Vector}
	 */
	_getTouchPos(touch) {
		const rect = this.canvas.getBoundingClientRect();
		const scaleX = this.canvas.width / rect.width;
		const scaleY = this.canvas.height / rect.height;
		return new Vector(
			(touch.clientX - rect.left) * scaleX,
			(touch.clientY - rect.top) * scaleY
		);
	}
	reposition() {
		if (!this.ondrag) {
			this.pos = this.pos.add(
				this.origin.sub(this.pos).mul(this.handleFriction)
			);
		} else {
			const diff = this.touchPos.sub(this.origin);
			const maxDist = Math.min(diff.mag(), this.radius);
			this.pos = this.origin.add(diff.normalize().mul(maxDist));
		}
	}
	draw() {
		this.ctx.beginPath();
		this.ctx.arc(this.origin.x, this.origin.y, this.radius, 0, Math.PI * 2);
		this.ctx.fillStyle = this.color;
		this.ctx.fill();
		this.ctx.closePath();
		if (this.borderWidth > 0) {
			this.ctx.beginPath();
			this.ctx.arc(
				this.origin.x,
				this.origin.y,
				this.radius,
				0,
				Math.PI * 2
			);
			this.ctx.lineWidth = this.borderWidth;
			this.ctx.strokeStyle = this.borderColor;
			this.ctx.stroke();
			this.ctx.closePath();
		}
		this.ctx.beginPath();
		this.ctx.arc(this.pos.x, this.pos.y, this.handleRadius, 0, Math.PI * 2);
		this.ctx.fillStyle = this.handleColor;
		this.ctx.fill();
		this.ctx.closePath();
	}
	clearDraw() {
		const size = Math.ceil(
			this.radius + this.handleRadius + this.borderWidth + 2
		);
		this.ctx.clearRect(
			this.origin.x - size,
			this.origin.y - size,
			size * 2,
			size * 2
		);
	}
	/** @param {boolean} clearDraw */
	update(clearDraw = false) {
		if (clearDraw) this.clearDraw();
		this.reposition();
		this.draw();
	}
	/**
	 * @param {string | string[]} event
	 * @returns {boolean}
	 */
	isDirection(event) {
		const dir = this.direction;
		return Array.isArray(event)
			? event.some(n => n === dir)
			: event === dir;
	}
	get handlePos() {
		return this.pos.sub(this.origin);
	}
	/**
	 * @param {number} speed
	 * @returns {Vector}
	 */
	getVector() {
		const move = this.handlePos;
		if (this.ondrag && move.mag() > this.deadZone) return move.normalize();
		return new Vector(0, 0);
	}
	/** @returns {boolean} */
	isMoving() {
		return this.ondrag && this.handlePos.mag() > this.deadZone;
	}
	destroy() {
		this._listening = false;
		this.canvas.removeEventListener("touchstart", this._onStart);
		this.canvas.removeEventListener("touchmove", this._onMove, {
			passive: false,
		});
		this.canvas.removeEventListener("touchend", this._onEnd);
	}
}
export class KeyMove extends Controller {
	/**
	 * @typedef {Object} keys
	 * @property {string | string[]} [left]
	 * @property {string | string[]} [right]
	 * @property {string | string[]} [up]
	 * @property {string | string[]} [down]
	 */
	/**
	 * @param {keys} [keys]
	 */
	constructor({ left, right, up, down } = {}) {
		super(0, 0);
		this.left = toArrayStr(left) ?? ["a", "arrowleft"];
		this.right = toArrayStr(right) ?? ["d", "arrowright"];
		this.up = toArrayStr(up) ?? ["w", "arrowup"];
		this.down = toArrayStr(down) ?? ["s", "arrowdown"];
		this.keys = new Set();
		this._onKeyDown = this._onKeyDown.bind(this);
		this._onKeyUp = this._onKeyUp.bind(this);
		this.onKeyDown = null;
		this.onKeyUp = null;
		this._listener();
	}
	_listener() {
		window.addEventListener("keydown", this._onKeyDown);
		window.addEventListener("keyup", this._onKeyUp);
	}
	/** @param {KeyboardEvent} event */
	_onKeyDown(event) {
		this.keys.add(event.key.toLowerCase());
		this._updateMove();
		try {
			this.onKeyDown?.(this.getVector());
		} catch {}
	}
	/** @param {KeyboardEvent} event */
	_onKeyUp(event) {
		this.keys.delete(event.key.toLowerCase());
		this._updateMove();
		try {
			this.onKeyUp?.(this.getVector());
		} catch {}
	}
	_updateMove() {
		this.pos = new Vector(0, 0);
		if (this.up.some(n => this.keys.has(n))) this.pos.y -= 1;
		if (this.right.some(n => this.keys.has(n))) this.pos.x += 1;
		if (this.down.some(n => this.keys.has(n))) this.pos.y += 1;
		if (this.left.some(n => this.keys.has(n))) this.pos.x -= 1;
	}
	/**
	 * @typedef {Object} keys
	 * @property {string | string[]} [left]
	 * @property {string | string[]} [right]
	 * @property {string | string[]} [up]
	 * @property {string | string[]} [down]
	 */
	/**
	 * @param {keys} [keys]
	 */
	changeKey({ left, right, up, down } = {}) {
		this.left = toArrayStr(left) ?? this.left;
		this.right = toArrayStr(right) ?? this.right;
		this.up = toArrayStr(up) ?? this.up;
		this.down = toArrayStr(down) ?? this.down;
	}
	/**
	 * @param {string | string[]} event
	 * @returns {boolean}
	 */
	isPressing(event) {
		return Array.isArray(event)
			? event.some(n => this.keys.has(n))
			: this.keys.has(event);
	}
	destroy() {
		window.removeEventListener("keydown", this._onKeyDown);
		window.removeEventListener("keyup", this._onKeyUp);
	}
}

// === helper function ===
/**
 * @param {string | string[]} val
 * @returns {string[]}
 */
function toArrayStr(val) {
	return []
		.concat(val)
		.flat(Infinity)
		.filter(v => typeof v === "string")
		.map(v => v.toLowerCase());
}
