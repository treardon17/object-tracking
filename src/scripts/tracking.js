import jsfeat from 'jsfeat'
import { debug } from 'util'

export default class Tracking {
  constructor({ width, height }) {
    this.width = width
    this.height = height
    this.setDefaults()
  }

  setDefaults() {
    this.numTrainLevels = 4
    this.homo3x3 = new jsfeat.matrix_t(3, 3, jsfeat.F32C1_t)
    this.matchMask = new jsfeat.matrix_t(500, 1, jsfeat.U8C1_t)
    this.screenCorners = this.createScreenCorners({ width: this.width, height: this.height })
    this.numCorners = 0
    this.imgU8 = null
    this.imgU8Smooth = null
    this.numGoodMatches = 0
    this.rectCorners = []
  }

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

  get descriptors() {
    return this._descriptors
  }

  setTraining({ trainingImg }) {
    let imageData
    if (typeof trainingImg === 'string') {
      const image = new Image()
      image.onload = (img) => {
        image.width = 100
        image.height = 100
        const canvas = document.createElement('canvas')
        canvas.id = 'training-canvas'
        document.body.appendChild(canvas)
        const ctx = canvas.getContext('2d')
        canvas.width = this.width
        canvas.height = this.height
        const imgX = (canvas.width / 2) - (image.width / 2)
        const imgY = (canvas.height / 2) - (image.height / 2)
        const imgDim = canvas.height / 2
        ctx.drawImage(image, imgX, imgY, imgDim, imgDim)
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        this.training = this.trainPattern({ imageData })
      }
      image.src = trainingImg
    } else {
      imageData = trainingImg
      this.training = this.trainPattern({ imageData })
    }
  }

  tick({ imageData }) {
    this._descriptors = this.ORBDescriptors({ imageData })
    this.numCorners = this.detectKeypoints(this.descriptors.imgU8Smooth, this.screenCorners, 500)
    jsfeat.orb.describe(this.descriptors.imgU8Smooth, this.screenCorners, this.numCorners, this.descriptors.screenDescriptors)

    if (this.training) {
      const matches = this.matchPattern({ screenDescriptors: this.descriptors.screenDescriptors, patternDescriptors: this.training.patternDescriptors })
      this.numGoodMatches = this.findTransform({
        matches: matches.items,
        count: matches.length,
        screenCorners: this.screenCorners,
        patternCorners: this.training.patternCorners
      })
      this.rectCorners = this.tCorners(this.homo3x3.data, this.width, this.height)
    }
  }

  createGrayscaleU8Image({ width, height, imageData }) {
    let imgU8
    if (imageData) {
      const imgWidth = imageData.width
      const imgHeight = imageData.height
      imgU8 = new jsfeat.matrix_t(imgWidth, imgHeight, jsfeat.U8_t | jsfeat.C1_t)
      const code = jsfeat.COLOR_RGBA2GRAY
      jsfeat.imgproc.grayscale(imageData.data, imgWidth, imgHeight, imgU8, code)
    } else {
      imgU8 = new jsfeat.matrix_t(width, height, jsfeat.U8_t | jsfeat.C1_t)
    }
    return imgU8
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

  createScreenCorners({ width, height }) {
    const screenCorners = []
    let i = width * height
    while (--i >= 0) {
      screenCorners[i] = new jsfeat.keypoint_t(0, 0, 0, 0, -1)
    }
    return screenCorners
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
  ORBDescriptors({ imageData, maxKeypoints = 500 } = {}) {
    const { data, width, height } = imageData
    const imgU8 = new jsfeat.matrix_t(width, height, jsfeat.U8_t | jsfeat.C1_t)
    const imgU8Smooth = new jsfeat.matrix_t(width, height, jsfeat.U8_t | jsfeat.C1_t)
    const screenDescriptors = new jsfeat.matrix_t(32, 500, jsfeat.U8_t | jsfeat.C1_t)
    // const patternDescriptors = []
    const keypoints = []

    jsfeat.imgproc.grayscale(data, width, height, imgU8)
    jsfeat.imgproc.gaussian_blur(imgU8, imgU8Smooth, this.options.blurSize)

    for (let i = width * height; i >= 0; --i) keypoints[i] = new jsfeat.keypoint_t(0, 0, 0, 0, -1)

    const numKeypoints = this.detectKeypoints(imgU8Smooth, keypoints, maxKeypoints)
    jsfeat.orb.describe(imgU8Smooth, keypoints, numKeypoints, screenDescriptors)

    const points = []
    for (let i = 0; i < numKeypoints; i++) {
      const sub = Array.from(screenDescriptors.data.slice(i * 32, (i + 1) * 32))
      points.push(Object.assign({}, keypoints[i], { descriptor: sub }))
    }

    return {
      keypoints: points,
      screenDescriptors,
      imgU8,
      imgU8Smooth
    }
  }

  // project/transform rectangle corners with 3x3 Matrix
  tCorners(M, w, h) {
    const pt = [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }]
    let z = 0.0
    let i = 0
    let px = 0.0
    let py = 0.0

    /* eslint-disable */
    for (; i < 4; ++i) {
      px = M[0] * pt[i].x + M[1] * pt[i].y + M[2]
      py = M[3] * pt[i].x + M[4] * pt[i].y + M[5]
      z = M[6] * pt[i].x + M[7] * pt[i].y + M[8]
      pt[i].x = px / z
      pt[i].y = py / z
    }
    /* eslint-enable */

    return pt
  }

  // non zero bits count
  popcnt32(n) {
    /* eslint-disable */
    n -= ((n >> 1) & 0x55555555)
    n = (n & 0x33333333) + ((n >> 2) & 0x33333333)
    return (((n + (n >> 4)) & 0xF0F0F0F) * 0x1010101) >> 24
    /* eslint-enable */
  }

  trainPattern({ imageData, numTrainLevels = this.numTrainLevels }) {
    const imgU8 = this.createGrayscaleU8Image({ imageData })
    const { rows, cols } = imgU8
    // const cols = imageData.width
    // const rows = imageData.height
    const patternCorners = []
    const patternDescriptors = []
    // let patternPreview
    let lev = 0
    let i = 0
    let sc = 1.0
    const maxPatternSize = 300 // 512
    const maxPerLevel = 300 // 300
    const scInc = Math.sqrt(2.0) // magic number ;)
    const lev0Img = new jsfeat.matrix_t(cols, rows, jsfeat.U8_t | jsfeat.C1_t)
    const levImg = new jsfeat.matrix_t(cols, rows, jsfeat.U8_t | jsfeat.C1_t)
    let newWidth = 0
    let newHeight = 0
    let levCorners
    let levDescr
    let cornersNum = 0

    const sc0 = Math.min(maxPatternSize / cols, maxPatternSize / rows)
    newWidth = (imgU8.cols * sc0) | 0
    newHeight = (imgU8.rows * sc0) | 0

    jsfeat.imgproc.resample(imgU8, lev0Img, newWidth, newHeight)

    for (lev = 0; lev < numTrainLevels; ++lev) {
      patternCorners[lev] = []
      levCorners = patternCorners[lev]

      // preallocate corners array
      i = (newWidth * newHeight) >> lev
      while (--i >= 0) {
        levCorners[i] = new jsfeat.keypoint_t(0, 0, 0, 0, -1)
      }

      patternDescriptors[lev] = new jsfeat.matrix_t(32, maxPerLevel, jsfeat.U8_t | jsfeat.C1_t)
    }

    // do the first level
    levCorners = patternCorners[0]    // eslint-disable-line
    levDescr = patternDescriptors[0]  // eslint-disable-line

    jsfeat.imgproc.gaussian_blur(lev0Img, levImg, this.options.blurSize | 0) // this is more robust
    cornersNum = this.detectKeypoints(levImg, levCorners, maxPerLevel)
    jsfeat.orb.describe(levImg, levCorners, cornersNum, levDescr)

    console.log(`train ${levImg.cols}x${levImg.rows} points: ${cornersNum}`)

    sc /= scInc

    // lets do multiple scale levels
    // we can use Canvas context draw method for faster resize
    // but its nice to demonstrate that you can do everything with jsfeat
    for (lev = 1; lev < numTrainLevels; ++lev) {
      levCorners = patternCorners[lev]
      levDescr = patternDescriptors[lev]

      newWidth = (lev0Img.cols * sc) | 0
      newHeight = (lev0Img.rows * sc) | 0

      jsfeat.imgproc.resample(lev0Img, levImg, newWidth, newHeight)
      jsfeat.imgproc.gaussian_blur(levImg, levImg, this.options.blurSize | 0)
      cornersNum = this.detectKeypoints(levImg, levCorners, maxPerLevel)
      jsfeat.orb.describe(levImg, levCorners, cornersNum, levDescr)

      // fix the coordinates due to scale level
      for (i = 0; i < cornersNum; ++i) {
        levCorners[i].x *= 1.0 / sc
        levCorners[i].y *= 1.0 / sc
      }

      console.log(`train ${levImg.cols}x${levImg.rows} points: ${cornersNum}`)

      sc /= scInc
    }

    return {
      patternCorners,
      patternDescriptors
    }
  }

  // naive brute-force matching.
  // each on screen point is compared to all pattern points
  // to find the closest match
  matchPattern({ screenDescriptors, patternDescriptors, matchThreshold = 48, numTrainLevels = this.numTrainLevels }) {
    const matches = []
    const qCnt = screenDescriptors.rows
    const queryDu8 = screenDescriptors.data
    const queryU32 = screenDescriptors.buffer.i32 // cast to integer buffer
    let qdOff = 0
    let qidx = 0
    let lev = 0
    let pidx = 0
    let k = 0
    let numMatches = 0

    for (qidx = 0; qidx < qCnt; ++qidx) {
      let bestDist = 256
      let bestDist2 = 256
      let bestIdx = -1
      let bestLev = -1

      for (lev = 0; lev < numTrainLevels; ++lev) {
        const levDescr = patternDescriptors[lev]
        const ldCnt = levDescr.rows
        const ldI32 = levDescr.buffer.i32 // cast to integer buffer
        let ldOff = 0

        for (pidx = 0; pidx < ldCnt; ++pidx) {
          let currD = 0
          // our descriptor is 32 bytes so we have 8 Integers
          for (k = 0; k < 8; ++k) {
            currD += this.popcnt32(queryU32[qdOff + k] ^ ldI32[ldOff + k])
          }

          if (currD < bestDist) {
            bestDist2 = bestDist
            bestDist = currD
            bestLev = lev
            bestIdx = pidx
          } else if (currD < bestDist2) {
            bestDist2 = currD
          }

          ldOff += 8 // next descriptor
        }
      }

      // filter out by some threshold
      // if (bestDist < matchThreshold) {
      //   matches[numMatches] = {}
      //   matches[numMatches].screen_idx = qidx
      //   matches[numMatches].pattern_lev = bestLev
      //   matches[numMatches].pattern_idx = bestIdx
      //   numMatches++
      // }

      if (bestDist < 0.8 * bestDist2) {
        matches[numMatches] = {}
        matches[numMatches].screen_idx = qidx
        matches[numMatches].pattern_lev = bestLev
        matches[numMatches].pattern_idx = bestIdx
        numMatches++
      }

      qdOff += 8 // next query descriptor
    }

    return {
      length: numMatches,
      items: matches
    }
  }

  // estimate homography transform between matched points
  findTransform({ matches, count, screenCorners, patternCorners }) {
    // motion kernel
    const mmKernel = new jsfeat.motion_model.homography2d()
    // ransac params
    const numModelPoints = 4
    const reprojThreshold = 3
    const ransacParam = new jsfeat.ransac_params_t(
      numModelPoints,
      reprojThreshold, 0.5, 0.99
    )

    const patternXY = []
    const screenXY = []

    // construct correspondences
    for (let i = 0; i < count; ++i) {
      const m = matches[i]
      const sKp = screenCorners[m.screen_idx]
      const pKp = patternCorners[m.pattern_lev][m.pattern_idx]
      patternXY[i] = { x: pKp.x, y: pKp.y }
      screenXY[i] = { x: sKp.x, y: sKp.y }
    }

    // estimate motion
    let ok = false
    ok = jsfeat.motion_estimator.ransac(
      ransacParam, mmKernel,
      patternXY, screenXY, count, this.homo3x3, this.matchMask, 1000
    )

    // extract good matches and re-estimate
    let goodCnt = 0
    if (ok) {
      for (let i = 0; i < count; ++i) {
        if (this.matchMask.data[i]) {
          patternXY[goodCnt].x = patternXY[i].x
          patternXY[goodCnt].y = patternXY[i].y
          screenXY[goodCnt].x = screenXY[i].x
          screenXY[goodCnt].y = screenXY[i].y
          goodCnt++
        }
      }
      // run kernel directly with inliers only
      mmKernel.run(patternXY, screenXY, this.homo3x3, goodCnt)
    } else {
      jsfeat.matmath.identity_3x3(this.homo3x3, 1.0)
    }

    return goodCnt
  }
}
