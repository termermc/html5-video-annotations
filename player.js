'use strict'

const _html5VideoAnnotationsStyle = document.createElement('style')
_html5VideoAnnotationsStyle.innerText = `
.html5-video-annotations-overlay {
	background: none;
	position: absolute;
	overflow: hidden;
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

class Color {
	/**
	 * Creates a new color from a hex string
	 * @param {string} hex The hex string (e.g. `#ff0000`)
	 * @returns {Color}
	 */
	static fromHex(hex) {
		if (hex.startsWith('#')) {
			hex = hex.substring(1)
		}

		const r = parseInt(hex.substring(0, 2), 16)
		const g = parseInt(hex.substring(2, 4), 16)
		const b = parseInt(hex.substring(4, 6), 16)

		return new Color(r, g, b)
	}

	/**
	 * The red value (0-255)
	 * @type {number}
	 */
	red

	/**
	 * The green value (0-255)
	 * @type {number}
	 */
	green

	/**
	 * The blue value (0-255)
	 * @type {number}
	 */
	blue

	/**
	 * The alpha value (0.0-1.0)
	 */
	alpha

	/**
	 * Creates a new color
	 * @param {number} red The red value (0-255)
	 * @param {number} green The green value (0-255)
	 * @param {number} blue The blue value (0-255)
	 * @param {number} alpha The alpha value (0.0-1.0)
	 */
	constructor(red, green, blue, alpha = 1.0) {
		this.red = red
		this.green = green
		this.blue = blue
		this.alpha = alpha
	}

	/**
	 * Sets color values from a hex string
	 * @param {string} hex The hex string (e.g. `#ff0000`)
	 */
	setFromHex(hex) {
		if (hex.startsWith('#')) {
			hex = hex.substring(1)
		}

		this.red = parseInt(hex.substring(0, 2), 16)
		this.green = parseInt(hex.substring(2, 4), 16)
		this.blue = parseInt(hex.substring(4, 6), 16)
		this.alpha = 1.0
	}

	/**
	 * Converts the color to a CSS string
	 * @returns {string}
	 */
	toCss() {
		return `rgba(${this.red}, ${this.green}, ${this.blue}, ${this.alpha})`
	}
}

/**
 * Base class for annotations
 * @abstract
 */
class Annotation {
	/**
	 * The start timestamp, in tenths of a second
	 * @type {number}
	 */
	start

	/**
	 * The end timestamp, in tenths of a second
	 * @type {number}
	 */
	end

	/**
	 * The annotation's X coordinate (in percent of the <video> element's width)
	 * @type {number}
	 */
	x

	/**
	 * Sets the annotation's Y coordinate (in percent of the <video> element's height)
	 * @param {number} value
	 */
	y

	/**
	 * The annotation's width (in percent of the <video> element's width)
	 * @type {number}
	 */
	width

	/**
	 * The annotation's height (in percent of the <video> element's height)
	 * @type {number}
	 */
	height

	/**
	 * The annotation element to append to the overlay
	 * @type {HTMLElement}
	 */
	get element() { throw new Error('Not implemented') }

	/**
	 * Updates the annotation's element based on its current property values
	 */
	updateElement() { throw new Error('Not implemented') }

	/**
	 * Instantiates a new annotation
	 * @param {number} start The start timestamp (in tenths of a second)
	 * @param {number} end The end timestamp (in tenths of a second)
	 * @param {number} x The annotation's X coordinate (in percent of the <video> element's width)
	 * @param {number} y The annotation's Y coordinate (in percent of the <video> element's height)
	 * @param {number} width The annotation's width (in percent of the <video> element's width)
	 * @param {number} height The annotation's height (in percent of the <video> element's height)
	 */
	constructor(start, end, x, y, width, height) {
		this.start = start
		this.end = end
		this.x = x
		this.y = y
		this.width = width
		this.height = height
	}
}

/**
 * An annotation that contains text
 * @abstract
 */
class TextAnnotation extends Annotation {
	/** @type {HTMLAnchorElement} */
	#element

	/**
	 * The annotation's text
	 * @type {string}
	 */
	text

	/**
	 * The annotation's font size, in `rem`
	 * @type {number}
	 */
	textSize

	/**
	 * The annotation's text color
	 * @type {Color}
	 */
	textColor

	/**
	 * The annotation's link URL (or null for no link)
	 * @type {string | null}
	 */
	url

	/**
	 * The annotation's background color
	 * @type {Color}
	 */
	backgroundColor

	/**
	 * The annotation's border color
	 * @type {Color}
	 */
	borderColor

	/**
	 * The annotation's border width, in `rem`
	 * @type {number}
	 */
	borderWidth

	/**
	 * The annotation's border radius, in `rem`
	 * @type {number}
	 */
	borderRadius

	/**
	 * The annotation's padding, in `rem`
	 * @type {number}
	 */
	padding

	/**
	 * Creates a new text annotation
	 * @param {number} start The start timestamp (in tenths of a second)
	 * @param {number} end The end timestamp (in tenths of a second)
	 * @param {number} x The annotation's X coordinate (in percent of the <video> element's width)
	 * @param {number} y The annotation's Y coordinate (in percent of the <video> element's height)
	 * @param {number} width The annotation's width (in percent of the <video> element's width)
	 * @param {number} height The annotation's height (in percent of the <video> element's height)
	 * @param {string} text The annotation's text
	 * @param {number} textSize The annotation's font size, in `rem`
	 * @param {Color} textColor The annotation's text color
	 * @param {string | null} url The annotation's link URL (or null for no link)
	 * @param {Color} backgroundColor The annotation's background color
	 * @param {Color} borderColor The annotation's border color
	 * @param {number} borderWidth The annotation's border width, in `rem`
	 * @param {number} borderRadius The annotation's border radius, in `rem`
	 * @param {number} padding The annotation's padding, in `rem`
	 */
	constructor(start, end, x, y, width, height, text, textSize, textColor, url, backgroundColor, borderColor, borderWidth, borderRadius, padding) {
		super(start, end, x, y, width, height)

		this.text = text
		this.textSize = textSize
		this.textColor = textColor
		this.url = url
		this.backgroundColor = backgroundColor
		this.borderColor = borderColor
		this.borderWidth = borderWidth
		this.borderRadius = borderRadius
		this.padding = padding

		const elem = document.createElement('a')

		elem.style.display = 'block'
		elem.style.position = 'absolute'
		elem.style.borderStyle = 'solid'
		elem.style.overflowWrap = 'break-word'
		elem.style.whiteSpace = 'pre-wrap'
		elem.style.overflow = 'hidden'
		elem.style.textDecoration = 'none'
		elem.target = '_blank'

		this.#element = elem

		this.updateElement()
	}

	get element() { return this.#element }

	updateElement() {
		this.#element.innerText = this.text
		this.#element.title = this.text
		this.#element.style.fontSize = `${Number(this.textSize)}rem`
		this.#element.style.color = this.textColor.toCss()
		if (this.url) {
			this.#element.href = this.url
		} else {
			delete this.#element.href
		}
		this.#element.style.left = `${Number(this.x)}%`
		this.#element.style.top = `${Number(this.y)}%`
		this.#element.style.width = `${Number(this.width)}%`
		this.#element.style.height = `${Number(this.height)}%`
		this.#element.style.backgroundColor = this.backgroundColor.toCss()
		this.#element.style.borderColor = this.borderColor.toCss()
		this.#element.style.borderWidth = `${Number(this.borderWidth)}rem`
		this.#element.style.borderRadius = `${Number(this.borderRadius)}rem`
		this.#element.style.padding = `${Number(this.padding)}rem`
	}
}

class SpeechBubbleAnnotation extends TextAnnotation {
	// TODO Arrow X and Y

	/**
	 * Creates a new speech bubble annotation
	 * @param {number} start The start timestamp (in tenths of a second)
	 * @param {number} end The end timestamp (in tenths of a second)
	 * @param {number} x The annotation's X coordinate (in percent of the <video> element's width)
	 * @param {number} y The annotation's Y coordinate (in percent of the <video> element's height)
	 * @param {number} width The annotation's width (in percent of the <video> element's width)
	 * @param {number} height The annotation's height (in percent of the <video> element's height)
	 * @param {string} text The annotation's text
	 * @param {number} textSize The annotation's font size, in `rem`
	 * @param {Color} textColor The annotation's text color
	 * @param {string | null} url The annotation's link URL (or null for no link)
	 * @param {Color} backgroundColor The annotation's background color
	 * @param {Color} borderColor The annotation's border color
	 * @param {number} borderWidth The annotation's border width, in `rem`
	 * @param {number} borderRadius The annotation's border radius, in `rem`
	 * @param {number} padding The annotation's padding, in `rem`
	 */
	constructor(start, end, x, y, width, height, text, textSize, textColor, url, backgroundColor, borderColor, borderWidth, borderRadius, padding) {
		super(start, end, x, y, width, height, text, textSize, textColor, url, backgroundColor, borderColor, borderWidth, borderRadius, padding)
	}
}

/**
 * A video annotation player instance
 */
class AnnotationPlayer {
	/** @type {Annotation[]} */
	#annotations = []
	/** @type {HTMLDivElement} */
	#overlay
	/** @type {HTMLVideoElement} */
	#video
	/** @type {AnnotationPlayerOptions} */
	#options
	/** @type {number} */
	#resizeInterval

	/** @type {Annotation[]} */
	#lastVisibleAnnotations = []

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
		this.#resizeInterval = setInterval(updateDisplayCallback, 1_000) // <-- Every second

		// Set properties
		this.#video = video
		this.#options = ops
		this.#overlay = overlay

		// Append overlay and update display
		video.parentElement.append(overlay)
		this.updateOverlayDisplay()

		video.addEventListener('timeupdate', this.updateVisibleAnnotations.bind(this))
	}

	/**
	 * Updates visible annotations based on which ones fall within the current video timestamp.
	 * This is called automatically as the video time changes.
	 * It only needs to be called manually when changes to annotation start/end times have been made and the video has not changed time yet.
	 */
	updateVisibleAnnotations() {
		const video = this.#video
		const currentTs = Math.floor(video.currentTime * 10)

		const tsAnnotations = []
		for (const anno of this.#annotations) {
			if (anno.start <= currentTs && anno.end >= currentTs) {
				tsAnnotations.push(anno)
			}
		}

		// Append new annotations
		for (const newAnno of tsAnnotations) {
			if (this.#lastVisibleAnnotations.indexOf(newAnno) === -1) {
				this.#overlay.appendChild(newAnno.element)
			}
		}

		// Remove old annotations
		for (const oldAnno of this.#lastVisibleAnnotations) {
			if (tsAnnotations.indexOf(oldAnno) === -1) {
				this.#overlay.removeChild(oldAnno.element)
			}
		}

		this.#lastVisibleAnnotations = tsAnnotations
	}

	/**
	 * Sets all annotations
	 * @param {Annotation[]} annotations The new annotations
	 */
	setAnnotations(annotations) {
		this.#annotations = annotations
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

/*
<svg
  width="50mm"
  height="50mm"
  viewBox="0 0 100 100"
  version="1.1"
  class="html5-video-annotations-annotation-speech-bubble"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:svg="http://www.w3.org/2000/svg">
  <g>
    <path
      style="fill:#ffffd3;fill-opacity:1;stroke:#000000;stroke-width:1"
      d="m 0.5, 0.5 h 99 V 50 H 30 L 0.5, 99.5 15,50 H 0.5 Z"
    />
    <text
      x="5"
      y="12"
      style="font-size:0.5em;fill:#000000;white-space:pre-wrap"
      class="html5-video-annotations-annotation-speech-bubble-text">line1
line2</text>
  </g>
</svg>

 */