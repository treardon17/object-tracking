import jsfeat from 'jsfeat'

export default class Tracking {
  // getters
  get options() {
    if (!this._options) {
      this._options = {
        blurSize: 5,
        lapThres: 30,
        eigenThres: 25
      }
    }
    return this._options
  }

  get uMax() {
    if (!this._uMax) this._uMax = new Int32Array([15, 15, 15, 15, 14, 14, 14, 13, 13, 12, 11, 10, 9, 8, 6, 3, 0])
    return this._uMax
  }

  icAngle(img, px, py) {
    const halfK = 15 // half patch size
    let m01 = 0
    let m10 = 0
    const src = img.data
    const step = img.cols
    let u = 0
    let v = 0
    const centerOff = ((py * step) + px) | 0
    let vSum = 0
    let d = 0
    let valPlus = 0
    let valMinus = 0

    // Treat the center line differently, v=0
    for (u = -halfK; u <= halfK; ++u) { m10 += u * src[centerOff + u] }

    // Go line by line in the circular patch
    for (v = 1; v <= halfK; ++v) {
      // Proceed over the two lines
      vSum = 0
      d = this.uMax[v]
      for (u = -d; u <= d; ++u) {
        valPlus = src[centerOff + u + v * step] // eslint-disable-line
        valMinus = src[centerOff + u - v * step] // eslint-disable-line
        vSum += (valPlus - valMinus)
        m10 += u * (valPlus + valMinus)
      }
      m01 += v * vSum
    }

    return Math.atan2(m01, m10)
  }

  detectKeypoints(img, corners, maxAllowed) {
    const cornersInternal = corners
    jsfeat.yape06.laplacian_threshold = this.options.lapThres
    jsfeat.yape06.min_eigen_value_threshold = this.options.eigenThres

    let count = jsfeat.yape06.detect(img, cornersInternal, 17)

    if (count > maxAllowed) {
      jsfeat.math.qsort(cornersInternal, 0, count - 1, (a, b) => (b.score < a.score))
      count = maxAllowed
    }

    for (let i = 0; i < count; ++i) {
      cornersInternal[i].angle = this.icAngle(img, cornersInternal[i].x, cornersInternal[i].y)
    }

    return count
  }

  // imageData is the result of canvas ctx.getImageData(x, y, width, height)
  ORBDescriptors(imageData) {
    const { data, width, height } = imageData
    const imgU8 = new jsfeat.matrix_t(width, height, jsfeat.U8_t | jsfeat.C1_t)
    const imgU8Smooth = new jsfeat.matrix_t(width, height, jsfeat.U8_t | jsfeat.C1_t)
    const screenDescriptors = new jsfeat.matrix_t(32, 500, jsfeat.U8_t | jsfeat.C1_t)
    // const patternDescriptors = []
    const keypoints = []

    jsfeat.imgproc.grayscale(data, width, height, imgU8)
    jsfeat.imgproc.gaussian_blur(imgU8, imgU8Smooth, this.options.blurSize)

    for (let i = width * height; i >= 0; --i) keypoints[i] = new jsfeat.keypoint_t(0, 0, 0, 0, -1)

    const numKeypoints = this.detectKeypoints(imgU8Smooth, keypoints, 1000)
    jsfeat.orb.describe(imgU8Smooth, keypoints, numKeypoints, screenDescriptors)

    const result = { points: [] }
    for (let i = 0; i < numKeypoints; i++) {
      const sub = Array.from(screenDescriptors.data.slice(i * 32, (i + 1) * 32))
      result.points.push(Object.assign({}, keypoints[i], { descriptor: sub }))
    }

    return {
      keypoints: [...result.points]
    }
  }
}
