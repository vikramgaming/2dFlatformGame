const cacheAssets = new Map();

const imageRegex = /\.(png|jpe?g|gif|webp|bmp|tiff?|svg|heic|heif|ico|avif|jfif|pjpeg|pjp)$/i;
const audioRegex = /\.(mp3|wav|flac|aac|ogg|m4a|wma|aiff?|alac|opus)$/i;
const videoRegex = /\.(mp4|mov|avi|mkv|wmv|flv|webm|m4v|3gp|mpeg|mpg|ts|m2ts|f4v)$/i;

// === make media ===

/**
 * @overload
 * @param {string} source
 * @returns {HTMLImageElement}
 * @throw make sure you insert the correct path to the image
*/
/**
 * @overload
 * @param {string[]} source
 * @returns {HTMLImageElement[]}
 * @throw make sure you insert the correct path to the image
*/
/**
 * @overload
 * @param {Object<string, string>} source
 * @returns {Object<string, HTMLImageElement>}
 * @throw make sure you insert the correct path to the image
*/
function image(sources) {
    if (typeof sources === 'string') return makeElement(sources, new Image());
    
    let result;
    if (Array.isArray(sources)) {
        result = []
    }
    else if (typeof sources === 'object') {
        result = {}
    };
    for (const src in sources) {
        result[src] = makeElement(sources[src], new Image());
    }
    return result;
}
/**
 * @overload
 * @param {string} source
 * @returns {HTMLAudioElement}
 * @throw make sure you insert the correct path to the image
*/
/**
 * @overload
 * @param {string[]} source
 * @returns {HTMLAudioElement[]}
 * @throw make sure you insert the correct path to the image
*/
/**
 * @overload
 * @param {Object<string, string>} source
 * @returns {Object<string, HTMLAudioElement>}
 * @throw make sure you insert the correct path to the image
*/
function audio(sources) {
    if (typeof sources === 'string') return makeElement(sources, new Audio());
    
    let result;
    if (Array.isArray(sources)) {
        result = []
    }
    else if (typeof sources === 'object') {
        result = {}
    };
    for (const src in sources) {
        result[src] = makeElement(sources[src], new Audio());
    }
    return result;
}
/**
 * @overload
 * @param {string} source
 * @returns {HTMLVideoElement}
 * @throw make sure you insert the correct path to the image
*/
/**
 * @overload
 * @param {string[]} source
 * @returns {HTMLVideoElement[]}
 * @throw make sure you insert the correct path to the image
*/
/**
 * @overload
 * @param {Object<string, string>} source
 * @returns {Object<string, HTMLVideoElement>}
 * @throw make sure you insert the correct path to the image
*/
function video(sources) {
    if (typeof sources === 'string') return makeElement(sources, document.createElement("video"));
    
    let result;
    if (Array.isArray(sources)) {
        result = []
    }
    else if (typeof sources === 'object') {
        result = {}
    };
    for (const src in sources) {
        result[src] = makeElement(sources[src], document.createElement("video"));
    }
    return result;
}

// === load progress ===

/**
 * @typedef {Object} Progress
 * @property {number} loaded
 * @property {number} error
 * @property {number} total
 * @property {number} percent
 * @property {string} src
 * @property {boolean} success
*/
/** @param {(progress: Progress) => void} callback */
async function onProgressAll(callback) {
    loadAssets(callback, cacheAssets.size, [...cacheAssets.values()])
}

/** 
 * @param {(progress: Progress) => void} callback
 * @param {Nested<HTMLImageElement> | Nested<HTMLAudioElement> | Nested<HTMLVideoElement>} sources
*/
async function onProgress(callback, ...sources) {
    const allResources = [];
    function getAssets(src) {
        if (src instanceof HTMLImageElement || src instanceof HTMLAudioElement || src instanceof HTMLVideoElement) {
            allResources.push(src);
            return;
        }
        if (Array.isArray(src) || (typeof src === 'object' && src !== null) && !(src instanceof Element)) {
            for (const d in src) {
                getAssets(src[d]);
            }
        }
    }
    getAssets(sources);
    loadAssets(callback, allResources.length, allResources);
}

export { image, audio, video, onProgressAll, onProgress }

// === function helper ===

/**
 * @template E
 * @param {string} src 
 * @param {E} element
 * @returns {E}
*/
function makeElement(src, element) {
    if (typeof src !== 'string' || !imageRegex.test(src)) throw new Error(`"${src}" is not image file`)
    if (!src.startsWith("./") && !src.startsWith("../") && !src.startsWith("/")) src = "./" + src;
    if (cacheAssets.has(src)) return cacheAssets.get(src);
    
    const el = element;
    el.src = src;
    cacheAssets.set(src, el);

    return el;
}

/** 
 * @param {Progress} callback
 * @param {number} amount
 * @param {Nested<HTMLImageElement> | Nested<HTMLAudioElement> | Nested<HTMLVideoElement>} sources
*/
async function loadAssets(callback, amount, sources) {
    const total = amount;
    let loaded = 0;
    let error = 0;

    if (!total) {
        if (callback) callback({ total, loaded, error, percent: 100, src: null, success: null });
        return;
    }

    const allResources = sources;

    function progress(success, src) {
        success ? loaded++ : error++;
        if (callback)
            callback({
                total,
                loaded,
                error,
                percent: Math.round(((loaded + error) / total) * 100),
                src,
                success
            });
    }

    const promises = allResources.map(src => new Promise(resolve => {
        const name = (src.src || "").split("/").pop().split("?")[0];
        if (src instanceof HTMLImageElement) {
            if (src.complete) {
                progress(true, name);
                return resolve(src);
            }
            src.onload = () => { progress(true, name); resolve(src); };
            src.onerror = () => { progress(false, name); resolve(src); };
        }

        else if (src instanceof HTMLAudioElement || src instanceof HTMLVideoElement) {
            if (src.readyState >= 3) {
                progress(true, name);
                return resolve(src);
            }
            src.oncanplaythrough = () => { progress(true, name); resolve(src); };
            src.onerror = () => { progress(false, name); resolve(src); };
        }
    }));

    await Promise.all(promises);
}