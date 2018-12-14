import React from 'react'
import Base from 'modules/module-base'
import CircleBtn from '../circle-button'
/* eslint-disable */
import { LoaderUtils } from 'three'
const { THREE } = window
THREE.LoaderUtils = LoaderUtils
import 'three/examples/js/loaders/OBJLoader'
import 'three/examples/js/loaders/GLTFLoader'
import 'three/examples/js/loaders/ColladaLoader'
import './style.scss'
/* eslint-enable */

class ARJSView extends Base {
  constructor() {
    super()
    this.state = {
      snapshotSrc: null,
      videoSrc: null
    }
  }

  componentDidMount() {
    super.componentDidMount()
    this.setup()
  }

  get snapshotSrc() {
    return this.state.snapshotSrc || null
  }

  setup() {
    return new Promise((resolve, reject) => {
      this.setDefaults()
      this.setBinds()
      this.setScene()
      this.setARToolkit()
        .then(this.setARToolkitContext.bind(this))
        .then(() => {
          this.setMarkerControls()
          this.renderScene()
          resolve()
        })
        .catch(reject)
    })
  }

  setDefaults() {
    this.width = 640
    this.height = 480
    this.fps = 60
    this.time = Date.now()
    this.prevTime = Date.now()
    this.sceneItems = {}
    this.mixers = {}
    this.keysPressed = {}
    this._visibleTimeout = null
  }


  setBinds() {
    window.addEventListener('resize', this.onResize.bind(this))
    window.addEventListener('keydown', this.onKeydown.bind(this))
    window.addEventListener('keyup', this.onKeyup.bind(this))
  }

  setScene() {
    // renderer
    this.renderer = new THREE.WebGLRenderer({
      preserveDrawingBuffer: true,
      canvas: this.refs.arLayer,
      antialias: true,
      alpha: true
    })
    this.renderer.setClearColor(new THREE.Color('lightgrey'), 0)
    this.renderer.setSize(this.width, this.height)
    // scene
    this.scene = new THREE.Scene()
    // camera
    this.camera = new THREE.Camera()
    this.scene.add(this.camera)
    // lighting
    // key light
    this.keyLight = new THREE.DirectionalLight(0xffffff)
    this.keyLight.position.set(0, 1, 1).normalize()
    this.scene.add(this.keyLight)
    // ambient
    this.ambientLight = new THREE.AmbientLight(0x404040)
    this.scene.add(this.ambientLight)
    // dimmer light
    this.dimmerLight = new THREE.DirectionalLight(0x99ccff, 0.7)
    this.dimmerLight.position.set(0, 0, 0).normalize()
    this.scene.add(this.dimmerLight)
    this.scene.visible = false

    // this.addHorse({ name: 'hidalgo' })
    // this.addStormTrooper({ name: 'trooper' })
    // this.addVideo({ name: 'plane', src: '/assets/video/timer.mp4' })
    // const width = 6.5
    // const height = 8.5

    // 8.5 x 11 sheet of paper
    // const proportion = 8.5 / 11
    const proportion = 1500 / 633
    const width = 3.9
    const height = width / proportion
    const rotation = {
      x: -Math.PI / 2,
      z: -Math.PI / 5.2,
    }
    this.addPlane({
      name: 'foreground',
      img: '/assets/img/fpo-play.jpg',
      width,
      height,
      rotation,
      position: {
        y: 0,
        x: 1.7400000000000004,
        z: -0.5439999999999998
      }
    })
  }

  setARToolkit() {
    return new Promise((resolve, reject) => {
      this.arToolkitSource = new THREEx.ArToolkitSource({ source: 'webcam' })
      this.arToolkitSource.init(() => {
        this.sourceVideo = this.arToolkitSource.domElement
        this.onResize()
        // remove the other videos the library adds to the page
        const arDomID = 'ar-webcam-source'
        const arVideos = document.querySelectorAll(`.${arDomID}`)
        for (let i = 0; i < arVideos.length; i += 1) document.body.removeChild(arVideos[i])
        // make it easy to reference in the future
        this.sourceVideo.classList.add(arDomID)
        if (this.refs.videoLayer) {
          this.sourceVideo.classList.add('hide')
        }
        resolve()
      })
    })
  }

  setARToolkitContext() {
    return new Promise((resolve, reject) => {
      // create atToolkitContext
      this.arToolkitContext = new THREEx.ArToolkitContext({
        cameraParametersUrl: '/assets/data/camera_para.dat',
        detectionMode: 'mono',
      })
      // initialize it
      this.arToolkitContext.init(() => {
        // copy projection matrix to camera
        this.camera.projectionMatrix.copy(this.arToolkitContext.getProjectionMatrix())
        resolve()
      })
    })
  }

  setMarkerControls() {
    this.markerControls = new THREEx.ArMarkerControls(this.arToolkitContext, this.camera, {
      type: 'pattern',
      patternUrl: '/assets/data/large-qr-marker.patt',
      // patternUrl: '/assets/data/high-res-fancy.patt',
      // patternUrl: '/assets/data/stage-14four-marker.patt',
      changeMatrixMode: 'cameraTransformMatrix'
    })
  }

  addPlane({ name, img, color, width, height, rotation, position }) {
    const geometry = new THREE.PlaneGeometry(width, height)
    let material
    if (typeof img === 'string') {
      const loader = new THREE.TextureLoader()
      material = new THREE.MeshLambertMaterial({
        color,
        map: loader.load(img)
      })
    } else {
      material = new THREE.MeshBasicMaterial({
        color,
        // transparent: true,
        // opacity: 1,
        side: THREE.DoubleSide
      })
      // material = new THREE.MeshNormalMaterial({
      //   color,
      //   // transparent: true,
      //   // opacity: 1,
      //   side: THREE.DoubleSide
      // })
    }
    // create mesh
    const mesh = new THREE.Mesh(geometry, material)
    // set rotation
    if (typeof rotation === 'object') {
      Object.keys(rotation).forEach((key) => {
        mesh.rotation[key] = rotation[key]
      })
    }
    // set position
    if (typeof position === 'object') {
      Object.keys(position).forEach((key) => {
        mesh.position[key] = position[key]
      })
    }
    this.scene.add(mesh)
    if (name) this.sceneItems[name] = mesh
  }

  addVideo({ name, src }) {
    return new Promise((resolve) => {
      this.setState({
        videoSrc: src
      }, () => {
        const geometry = new THREE.PlaneGeometry(6.5, 8.5)
        // const material = new THREE.MeshNormalMaterial({
        //   transparent: true,
        //   opacity: 1,
        //   side: THREE.DoubleSide
        // })
        const loader = new THREE.TextureLoader()
        const material = new THREE.MeshLambertMaterial({ map: loader.load('/assets/img/stream.jpg') })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.rotation.x = -Math.PI / 2
        mesh.position.y = -1
        this.scene.add(mesh)
        if (name) this.sceneItems[name] = mesh
        resolve()
      })
    })
  }

  addCube({ name }) {
    const geometry = new THREE.CubeGeometry(1, 1, 1)
    const material = new THREE.MeshNormalMaterial({
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.y = geometry.parameters.height / 2
    this.scene.add(mesh)
    if (name) this.sceneItems[name] = mesh
  }

  addMonkey({ name }) {
    return new Promise((resolve) => {
      const loader = new THREE.OBJLoader(this.loadingManager)
      loader.load('/assets/mesh/monkeyAward.obj', (obj) => {
        // scale monkey
        obj.position.y = 2.5 * 0.5
        obj.scale.x = 0.5
        obj.scale.y = 0.5
        obj.scale.z = 0.5

        const material = new THREE.MeshPhongMaterial({ ambient: 0x050505, color: 0xffffff, specular: 0x555555, shininess: 30 })

        obj.traverse((child) => {
          if (child instanceof THREE.Mesh) child.material = material
        })

        this.scene.add(obj)
        if (name) this.sceneItems[name] = obj
        resolve()
      })
    })
  }

  addHorse({ name }) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.GLTFLoader()
      loader.load('/assets/mesh/horse.glb', (gltf) => {
        const mesh = gltf.scene.children[0]
        const scale = 0.01
        mesh.scale.set(scale, scale, scale)
        this.scene.add(mesh)
        const mixer = new THREE.AnimationMixer(mesh)
        mixer.clipAction(gltf.animations[0]).setDuration(1).play()

        if (name) {
          this.sceneItems[name] = mesh
          this.mixers[name] = mixer
        }

        resolve()
      })
    })
  }

  addStormTrooper({ name }) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.ColladaLoader()
      loader.load('/assets/mesh/stormtrooper/stormtrooper.dae', (collada) => {
        const { animations } = collada
        const avatar = collada.scene
        avatar.rotation.z = 180 * (Math.PI / 180)
        // avatar.rotation.x = 180 * (Math.PI / 180)
        avatar.traverse((node) => {
          if (node.isScinnedMesh) {
            node.frustumCulled = false
          }
        })
        const mixer = new THREE.AnimationMixer(avatar)
        const action = mixer.clipAction(animations[0]).play()
        this.scene.add(avatar)

        if (name) {
          this.sceneItems[name] = avatar
          this.mixers[name] = mixer
        }

        resolve()
      })
    })
  }

  combineCanvases(canvases = [], { width, height, centerX, centerY, normalize }) {
    let base64 = ''
    if (canvases && canvases.length > 0) {
      const [firstCanvas] = canvases
      const baseCanvas = document.createElement('canvas')
      const shouldCenterX = centerX != null ? centerX : false
      const shouldCenterY = centerY != null ? centerY : false
      const theWidth = width || firstCanvas.width // || Math.max(...canvases.map(canvas => canvas.width))
      const theHeight = height || firstCanvas.height // || Math.max(...canvases.map(canvas => canvas.height))
      baseCanvas.width = theWidth
      baseCanvas.height = theHeight
      const ctx = baseCanvas.getContext('2d')
      for (let i = 0; i < canvases.length; i += 1) {
        const canvas = canvases[i]

        const canvasWidth = canvas.width
        const canvasHeight = canvas.height
        let newWidth = canvasWidth
        let newHeight = canvasHeight

        if (normalize && canvasWidth < canvasHeight) {
          // portrait video
          const prop = canvasWidth / canvasHeight
          if (theHeight > theWidth) {
            // portrait screensize
            newWidth = theHeight * prop
            newHeight = theHeight
          } else {
            // landscape screensize
            newWidth = theWidth
            newHeight = theWidth / prop
          }
        } else if (normalize) {
          // landscape video
          const prop = canvasHeight / canvasWidth
          if (theHeight > theWidth) {
            // portrait screensize
            newWidth = theHeight / prop
            newHeight = theHeight
          } else {
            // landscape screensize
            newWidth = theWidth
            newHeight = theWidth * prop
          }
        }

        const x = shouldCenterX ? ((theWidth / 2) - (newWidth / 2)) : 0
        const y = shouldCenterY ? ((theHeight / 2) - (newHeight / 2)) : 0

        ctx.drawImage(canvas, x, y, newWidth, newHeight)
      }
      base64 = baseCanvas.toDataURL()
    }
    return base64
  }

  snapshot = () => {
    const { videoLayer, arLayer } = this.refs
    let base64 = ''
    if (videoLayer && arLayer) {
      base64 = this.combineCanvases(
        [
          videoLayer,
          arLayer
        ],
        {
          centerX: true,
          centerY: true,
          normalize: true
        }
      )
    }
    this.setState({ snapshotSrc: base64 })
    this.downloadBtn.show()
    this.closeBtn.show()
    this.cameraBtn.hide()
    return base64
  }

  close = () => {
    this.downloadBtn.hide()
    this.closeBtn.hide()
    this.cameraBtn.show()
    this.setState({
      snapshotSrc: null
    })
  }

  renderMixers() {
    this.prevTime = this.time
    this.time = Date.now()
    Object.keys(this.mixers).forEach((key) => {
      const mixer = this.mixers[key]
      mixer.update((this.time - this.prevTime) * 0.001)
    })
  }

  renderARToolkit() {
    if (this.arToolkitSource.ready === false) return
    this.arToolkitContext.update(this.arToolkitSource.domElement)
    // this.scene.visible = this.camera.visible
    if (!this.camera.visible && !this._visibleTimeout) {
      this._visibleTimeout = setTimeout(() => {
        this.scene.visible = false
      }, 500)
    } else if (this.camera.visible) {
      clearTimeout(this._visibleTimeout)
      this._visibleTimeout = null
      this.scene.visible = true
    }
  }

  renderVideo() {
    const { videoLayer } = this.refs
    if (videoLayer) {
      const ctx = videoLayer.getContext('2d')
      ctx.clearRect(0, 0, videoLayer.width, videoLayer.height)
      ctx.drawImage(this.sourceVideo, 0, 0, videoLayer.width, videoLayer.height)
    }
  }

  renderScene() {
    setTimeout(() => { requestAnimationFrame(this.renderScene.bind(this)) }, 1000 / this.fps)
    this.renderVideo()
    this.renderARToolkit()
    if (!this.renderCount) this.renderCount = 0
    else this.renderCount += 1
    if (this.renderCount % 500 === 0) this.renderer.render(this.scene, this.camera)
    this.renderMixers()
  }

  handleKeyAction() {
    let positionChanged = false
    let rotationChanged = false
    let sizeChanged = false

    const isRotation = this.keysPressed.r
    let axis
    if (this.keysPressed.x) axis = 'x'
    else if (this.keysPressed.y) axis = 'y'
    else if (this.keysPressed.z) axis = 'z'
    const { foreground } = this.sceneItems
    const { position, rotation, scale } = foreground

    const { ArrowUp, ArrowDown } = this.keysPressed
    const arrowPressed = (ArrowUp || ArrowDown)

    // position or rotation change
    if (axis) {
      if (ArrowUp) {
        if (isRotation) {
          rotationChanged = true
          rotation[axis] += Math.PI / 360
        } else {
          positionChanged = true
          position[axis] += 0.1
        }
      } else if (ArrowDown) {
        if (isRotation) {
          rotationChanged = true
          rotation[axis] -= Math.PI / 360
        } else {
          positionChanged = true
          position[axis] -= 0.1
        }
      }
    }

    // width or height change
    const scaleChange = 0.025
    if (this.keysPressed.w && arrowPressed) {
      sizeChanged = true
      scale.x += ArrowUp ? scaleChange : -scaleChange
    } else if (this.keysPressed.h && arrowPressed) {
      sizeChanged = true
      scale.y += ArrowUp ? scaleChange : -scaleChange
    }
    
    if (positionChanged) console.log('position:', position)
    if (rotationChanged) console.log('rotation:', rotation)
    if (sizeChanged) console.log('dimensions:', scale)
  }

  onKeydown(e) {
    this.keysPressed[e.key] = true
    this.handleKeyAction()
  }

  onKeyup(e) {
    this.keysPressed[e.key] = false
    this.handleKeyAction()
  }

  onResize() {
    const width = window.innerWidth
    const height = window.innerHeight
    this.arToolkitSource.onResize()
    this.arToolkitSource.copySizeTo(this.renderer.domElement)
    const sourceWidth = parseFloat(this.renderer.domElement.style.width)
    const sourceHeight = parseFloat(this.renderer.domElement.style.height)

    const { videoLayer } = this.refs
    if (videoLayer) {
      const { videoWidth, videoHeight } = this.sourceVideo
      const videoAspect = videoHeight / videoWidth
      const windowAspect = height / width
      // console.log(videoAspect, windowAspect)
      videoLayer.width = videoWidth
      videoLayer.height = videoHeight
      if (videoWidth < videoHeight) {
        // portrait video
        const prop = videoWidth / videoHeight
        if (windowAspect > videoAspect) {
          // portrait screensize
          videoLayer.style.width = `${height * prop}px`
          videoLayer.style.height = `${height}px`
        } else {
          // landscape screensize
          videoLayer.style.width = `${width}px`
          videoLayer.style.height = `${width / prop}px`
        }
      } else {
        // landscape video
        const prop = videoHeight / videoWidth
        if (windowAspect > videoAspect) {
          // portrait screensize
          videoLayer.style.width = `${height / prop}px`
          videoLayer.style.height = `${height}px`
        } else {
          // landscape screensize
          videoLayer.style.width = `${width}px`
          videoLayer.style.height = `${width * prop}px`
        }
      }
    }

    // set container dimensions
    this.refs.layers.style.width = `${sourceWidth}px`
    this.refs.layers.style.height = `${sourceHeight}px`

    if (this.arToolkitContext && this.arToolkitContext.arController !== null) {
      this.arToolkitSource.copySizeTo(this.arToolkitContext.arController.canvas)
    }
  }

  render() {
    const video = null
    // const video = this.state.videoSrc ? (
    //   <video muted loop playsinline autoplay src={this.state.videoSrc}>
    //     <source />
    //   </video>
    // ) : null
    return (
      <div className="arjs-view">
        <div className="layers" data-ref="layers">
          <canvas className="video-layer" data-ref="videoLayer" />
          <canvas className="ar-layer" data-ref="arLayer" />
        </div>
        {this.snapshotSrc != null ? <div className="snapshot" style={{ backgroundImage: `url(${this.snapshotSrc})` }} data-ref="snapshot" /> : null}
        {/* { video } */}
        <div className="btn-container">
          <CircleBtn
            ref={ref => this.cameraBtn = ref}
            icon="/assets/icon/camera.svg"
            className="capture-btn"
            onClick={this.snapshot}
          />
          <CircleBtn
            ref={ref => this.closeBtn = ref}
            icon="/assets/icon/x.svg"
            className="close-btn"
            onClick={this.close}
          />
          <CircleBtn
            ref={ref => this.downloadBtn = ref}
            icon="/assets/icon/download.svg"
            className="download-btn"
            href={this.snapshotSrc}
            download="ar-snapshot.jpg"
          />
        </div>
      </div>
    )
  }
}

export default ARJSView
