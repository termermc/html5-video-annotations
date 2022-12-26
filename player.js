'use strict'

const _html5VideoAnnotationsStyle = document.createElement('style')
_html5VideoAnnotationsStyle.innerText = `
.html5-video-annotations-overlay {
	background: none;
	position: absolute;
	overflow: visible;
	pointer-events: none;
}
.html5-video-annotations-overlay * {
	pointer-events: auto;
	position: absolute;
}
`
document.head.appendChild(_html5VideoAnnotationsStyle)

/**
 * @typedef AnnotationPlayerOptions
 * Instantiation options for AnnotationPlayer
 * @property {number?} defaultZIndex The default CSS z-index value to use for the overlay if the <video> element does not have an assigned z-index
 * @property {(HTMLElement | null)?} proxyEventsTo When the annotations overlay generates an event, its events will be proxied to this element, or null for none
 */

/**
 * A video annotation player instance
 */
class AnnotationPlayer {
	/* Properties */
	/** @type {HTMLDivElement} */
	#overlay
	/** @type {HTMLVideoElement} */
	#video
	/** @type {AnnotationPlayerOptions} */
	#options
	/** @type {number} */
	#resizeInterval

	/* Getters and setters */
	/**
	 * The <div> overlay that contains annotation content
	 * @type {HTMLDivElement}
	 */
	get overlay() { return this.#overlay }

	/**
	 * The <video> element
	 * @returns {HTMLVideoElement}
	 */
	get video() { return this.#video }

	/**
	 * Returns whether the annotations overlay is visible
	 * @returns {boolean}
	 */
	get isVisible() { return this.#overlay.style.display !== 'none' }

	/**
	 * @param {HTMLVideoElement} video The <video> element
	 * @param {AnnotationPlayerOptions?} options
	 */
	constructor(video, options) {
		// Resolve options
		/** @type {AnnotationPlayerOptions} */
		const defaultOptions = {
			defaultZIndex: 100,
			proxyEventsTo: null
		}
		/** @type {AnnotationPlayerOptions} */
		const ops = { ...defaultOptions, ...options }

		// Create and set up overlay
		const overlay = document.createElement('div')
		overlay.classList.add('html5-video-annotations-overlay')
		overlay.style.display = 'block'

		// Update display periodically and on relevant events
		const updateDisplayCallback = this.updateOverlayDisplay.bind(this)
		video.parentElement.addEventListener('fullscreenchange', updateDisplayCallback)
		video.addEventListener('resize', updateDisplayCallback)
		this.#resizeInterval = setInterval(updateDisplayCallback, 1000) // <-- Every second

		// Set properties
		this.#video = video
		this.#options = ops
		this.#overlay = overlay

		// Append overlay and update display
		video.parentElement.append(overlay)
		this.updateOverlayDisplay()
	}

	/**
	 * Updates the overlay's size and coordinates on the screen to cover its associated <video> element
	 */
	updateOverlayDisplay() {
		const video = this.#video
		const overlay = this.#overlay

		// Calculate the video's z-index
		const zIndexStr = getComputedStyle(video).zIndex
		const overlayZIndex = zIndexStr === 'auto' ? this.#options.defaultZIndex : parseInt(zIndexStr) + 1

		// Update overlay properties
		overlay.style.zIndex = overlayZIndex.toString()
		overlay.style.width = `${video.clientWidth}px`
		overlay.style.height = `${video.clientHeight}px`
		overlay.style.left = `${video.offsetLeft}px`
		overlay.style.top = `${video.offsetTop}px`
	}

	/**
	 * Hides the annotations overlay
	 */
	hide() {
		this.#overlay.style.display = 'none'
	}

	/**
	 * Shows the annotations overlay
	 */
	show() {
		this.#overlay.style.display = 'block'
	}

	/**
	 * Toggles the annotations overlay's visibility
	 */
	toggleVisibility() {
		if (this.isVisible) {
			this.hide()
		} else {
			this.show()
		}
	}
}

/**
 * Generic annotation structure class to be extended by other classes
 */
class Annotation {
	/* Properties */
	/** @type {number} */
	#x
	/** @type {number} */
	#y
	/** @type {number} */
	#width
	/** @type {number} */
	#height

	/**
	 * Instantiates a new annotation.
	 * All measurements are in percent of the overlay, not in pixels.
	 * @param {number} x The x position of the annotation
	 * @param {number} y The y position of the annotation
	 * @param {number} width The width of the annotation
	 * @param {number} height The height of the annotation
	 */
	constructor(x, y, width, height) {
		this.#x = x
		this.#y = y
		this.#width = width
		this.#height = height
	}
}
