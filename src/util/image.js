
export default class ImageUtil {
  static getImageData({ image, canvas }) {
    let width = 0
    let height = 0
    const theCanvas = canvas || document.createElement('canvas')
    const ctx = theCanvas.getContext('2d')

    if (image instanceof Image) {
      ({ width, height } = image)
      theCanvas.width = width
      theCanvas.height = height
      ctx.drawImage(image, 0, 0, width, height)
    } else if (canvas) {
      ({ width, height } = canvas)
    }
    return ctx.getImageData(0, 0, width, height)
  }

  // input range [-100..100]
  static contrast({ image, canvas, contrast, imageData }) {
    const theImageData = imageData ? new ImageData(imageData.data, imageData.width, imageData.height) : null || ImageUtil.getImageData({ image, canvas })
    if (!theImageData || !theImageData.data) return null

    const d = theImageData.data
    const theContrast = (contrast / 100) + 1 // convert to decimal & shift range: [0..2]
    const intercept = 128 * (1 - theContrast)
    for (let i = 0; i < d.length; i += 4) { // r,g,b,a
      d[i] = (d[i] * theContrast) + intercept
      d[i + 1] = (d[i + 1] * theContrast) + intercept
      d[i + 2] = (d[i + 2] * theContrast) + intercept
    }
    return theImageData
  }

  static grayscale({ image, canvas, imageData }) {
    const theImageData = imageData ? new ImageData(imageData.data, imageData.width, imageData.height) : null || ImageUtil.getImageData({ image, canvas })
    if (!theImageData || !theImageData.data) return null

    const pixels = theImageData.data
    for (let i = 0, n = pixels.length; i < n; i += 4) { // eslint-disable-line
      const grayscale = (pixels[i] * 0.3) + (pixels[i + 1] * 0.59) + (pixels[i + 2] * 0.11)
      pixels[i] = grayscale // red
      pixels[i + 1] = grayscale // green
      pixels[i + 2] = grayscale // blue
      // pixels[i+3]              is alpha
    }
    return theImageData
  }

  static simplify({ image, canvas, imageData }) {
    const original = imageData || ImageUtil.getImageData({ image, canvas })
    const grayscale = ImageUtil.grayscale({ imageData: original })

    return {
      original,
      grayscale
    }
  }
}
