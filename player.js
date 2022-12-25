/**
 * @typedef AnnotationPlayerOptions
 * Instantiation options for AnnotationPlayer
 * @property {number?} fallbackZIndex The z-index to use when an appropriate one cannot be determined
 */

/**
 * A video annotation player instance
 */
class AnnotationPlayer {
	/**
	 * @param {HTMLVideoElement} videoElement The <video> element to bind to
	 * @param {AnnotationPlayerOptions?} options
	 */
	constructor(videoElement, options) {
		/** @type {AnnotationPlayerOptions} */
		const defaultOptions = {
			fallbackZIndex: 100
		}

		const ops = { ...defaultOptions, ...options }
	}
}