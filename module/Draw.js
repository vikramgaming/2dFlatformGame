/**
 * Utility class to simplify 2D canvas drawing operations.
 */
export class Canvas2D {
    /**
     * @param {HTMLCanvasElement} [canvas]
     */
    constructor(ctx) {
        if (!(ctx instanceof CanvasRenderingContext2D)) {
            throw new Error(`argument is not CanvasRenderingContext2D`)
        }
        /** @type {CanvasRenderingContext2D} */
        this.ctx = ctx;
    }

    /**
     * Clears a specific area.
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     */
    clearDraw(x, y, width, height) {
        this.ctx.clearRect(x, y, width, height);
    }

    // ---------- TEXT ----------

    /**
     * @typedef {Object} TextOptions
     * @property {string} [color]
     * @property {"left"|"right"|"center"|"start"|"end"} [textAlign]
     * @property {string} [font]
     */

    /**
     * Draw text onto the canvas.
     * @param {string} text
     * @param {number} x
     * @param {number} y
     * @param {TextOptions} [options]
     */
    drawText(text, x, y, {
        color = "black",
        textAlign = "center",
        font = "16px Arial",
    } = {}) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.textAlign = textAlign;
        this.ctx.font = font;
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }

    // ---------- RECTANGLES ----------

    /**
     * @typedef {Object} RectOptions
     * @property {string} [color]
     */

    /**
     * Draw a filled rectangle.
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {RectOptions} [options]
     * @returns {{x: number, y: number, width: number, height: number}} collision box
     */
    drawRect(x, y, width, height = width, {
        color = "black"
    } = {}) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
        this.ctx.restore();
        return { x, y, width, height };
    }

    /**
     * @typedef {Object} StrokeRectOptions
     * @property {string} [color]
     * @property {number} [lineWidth]
     */

    /**
     * Draw an outlined rectangle.
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {StrokeRectOptions} [options]
     * @returns {{x: number, y: number, width: number, height: number}} collision box
     */
    strokeRect(x, y, width, height = width, {
        color = "black",
        lineWidth = 1,
    } = {}) {
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeRect(x, y, width, height);
        this.ctx.restore();
        return { x, y, width, height };
    }

    // ---------- ARCS / CIRCLES ----------

    /**
     * @typedef {Object} ArcOptions
     * @property {string} [color]
     * @property {number} [startAngle]
     * @property {number} [endAngle]
     * @property {boolean} [counterclockwise]
     */

    /**
     * Draw a filled arc or circle.
     * @param {number} x
     * @param {number} y
     * @param {number} radius
     * @param {ArcOptions} [options]
     */
    drawArc(x, y, radius, {
        color = "black",
        startAngle = 0,
        endAngle = Math.PI * 2,
        counterclockwise = false,
    } = {}) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise);
        this.ctx.fill();
        this.ctx.restore();
    }

    /**
     * @typedef {Object} StrokeArcOptions
     * @property {string} [color]
     * @property {number} [startAngle]
     * @property {number} [endAngle]
     * @property {boolean} [counterclockwise]
     * @property {number} [lineWidth]
     */

    /**
     * Draw an outlined arc or circle.
     * @param {number} x
     * @param {number} y
     * @param {number} radius
     * @param {StrokeArcOptions} [options]
     */
    strokeArc(x, y, radius, {
        color = "black",
        startAngle = 0,
        endAngle = Math.PI * 2,
        counterclockwise = false,
        lineWidth = 1,
    } = {}) {
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise);
        this.ctx.stroke();
        this.ctx.restore();
    }

    // ---------- LINES ----------

    /**
     * @typedef {Object} LineOptions
     * @property {string} [color]
     * @property {number} [lineWidth]
     */

    /**
     * Draw a line.
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {{LineOptions}} [options]
     */
    drawLine(x1, y1, x2, y2, {
        color = "black",
        lineWidth = 2
    } = {}) {
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        this.ctx.restore();
    }

    // ---------- IMAGES ----------

    /**
     * Draw an image onto the canvas.
     * @param {HTMLImageElement} image
     * @param {number} x
     * @param {number} y
     * @param {number|null} [width]
     * @param {number|null} [height]
     * @param {boolean} [mirror]
     * @returns {{x: number, y: number, width: number, height: number}} collision box
     */
    drawImage(image, x, y, width = null, height = width, mirror = false) {
        width ??= image.width;
        height ??= image.height;
        
        this.ctx.save();
        if (mirror) {
            this.ctx.translate(x + width, y);
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(image, 0, 0, width, height);
        } else {
            this.ctx.drawImage(image, x, y, width, height);
        }
        this.ctx.restore();
        
        return { x, y, width, height };
    }
}

/**
 * @param {HTMLImageElement[]} images
 * @param {number} intervalImg
 * @returns {{ getImg: () => HTMLImageElement }}
 */
export function animation(images, intervalImg = 1000) {
    if (!(Array.isArray(images) && images.every(img => img instanceof HTMLImageElement))) 
        throw new Error("argument must be array of HTMLImageElement");
    if (images.length === 0) 
        throw new Error("images cannot be empty");
    
    if (typeof intervalImg !== 'number' || intervalImg <= 0) 
        intervalImg = 1000;

    let lastTime = 0;
    let index = 0;

    return {
        get image() {
            const now = performance.now();
    
            if (now - lastTime >= intervalImg) {
                lastTime = now;
                index = (index + 1) % images.length;
            }
    
            return images[index];
        },
        reset() {
           index = 0;
           lastTime = performance.now();
        }
    };
}