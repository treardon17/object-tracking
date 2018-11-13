// import 'jsartoolkit5/js/artoolkit.api'
// import '@/libraries/threejs'
// import '@/libraries/threex'
import 'three/examples/js/loaders/OBJLoader'
import React from 'react'
import PropTypes from 'prop-types'
import CameraView from 'modules/camera-view'
import Base from 'modules/module-base'
import './style.scss'
import { debug } from 'util'


class ARJSView extends Base {
  componentDidMount() {
    super.componentDidMount()
    this.setDefaults()
    this.setBinds()
    this.setup()
  }

  // /////////////////////////////////
  // SETUP
  // /////////////////////////////////
  setDefaults() {
    this.sceneItems = {}
    this.arStatus = null
  }

  setup() {
    return new Promise((resolve, reject) => {
      if (this.arStatus === null) {
        this.arStatus = 'loading'
        this.setScene()
        this.setupARToolkitSource()
          .then(this.setupARToolkitContext.bind(this))
          .then(() => {
            this.setupMarkerControls()
            this.arStatus = 'ready'
            this.renderScene()
            this.addCube({ name: 'cube' })
            resolve()
          })
      } else {
        resolve()
      }
    })
  }

  // /////////////////////////////////
  // LISTENERS
  // /////////////////////////////////
  setBinds() {
    window.addEventListener('resize', this.onResize.bind(this))
  }

  // /////////////////////////////////
  // EVENTS
  // /////////////////////////////////
  onResize() {
    // this.arToolkitSource.onResize()
    // this.arToolkitSource.copySizeTo(this.renderer.domElement)
    // this.width = parseInt(this.renderer.domElement.style.width, 10)
    // this.height = parseInt(this.renderer.domElement.style.height, 10)
    // if (this.arToolkitSource.arController != null) {
    //   this.arToolkitSource.copySizeTo(this.arToolkitContext.arController.canvas)
    // }
    // if (this.arToolkitContext != null) {
    //   this.camera.projectionMatrix.copy(this.arToolkitContext.getProjectionMatrix())
    // }
  }

  // /////////////////////////////////
  // ARJS
  // /////////////////////////////////
  setupARToolkitSource() {
    return new Promise((resolve, reject) => {
      this.arToolkitSource = new THREEx.ArToolkitSource({
        // // to read from the webcam
        sourceType: 'webcam',

        // // to read from an image
        // sourceType : 'image',
        // sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/images/img.jpg',

        // to read from a video
        // sourceType: 'video',
        // sourceUrl: this.cameraView.stream
      })
      this.arToolkitSource.init(() => {
        this.onResize()
        this.sourceVideo = this.arToolkitSource.domElement
        // remove the other videos the library adds to the page
        const arDomID = 'ar-webcam-source'
        const arVideos = document.querySelectorAll(`.${arDomID}`)
        for (let i = 0; i < arVideos.length; i += 1) document.body.removeChild(arVideos[i])
        // make it easy to reference in the future
        this.sourceVideo.classList.add(arDomID)
        // this.sourceVideo.style.position = 'fixed'
        // this.sourceVideo.style.top = '0'
        // this.sourceVideo.style.opacity = '0'
        resolve()
      })
    })
  }

  setupARToolkitContext() {
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

  setupMarkerControls() {
    this.markerControls = new THREEx.ArMarkerControls(this.arToolkitContext, this.camera, {
      type: 'pattern',
      patternUrl: '/assets/data/patt.hiro',
      // patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji',
      // as we controls the camera, set changeMatrixMode: 'cameraTransformMatrix'
      changeMatrixMode: 'cameraTransformMatrix'
    })
    // as we do changeMatrixMode: 'cameraTransformMatrix', start with invisible scene
    this.scene.visible = false
  }

  renderARToolkit() {
    if (this.arToolkitSource.ready === false) return
    this.arToolkitContext.update(this.arToolkitSource.domElement)
    this.scene.visible = this.camera.visible
  }

  // /////////////////////////////////
  // THREEJS SCENE
  // /////////////////////////////////
  setScene() {
    // init renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.refs.canvasOverlay,
      antialias: true,
      alpha: true
    })
    // init scene and camera
    this.scene = new THREE.Scene()
    // create a camera
    this.camera = new THREE.Camera()
    this.scene.add(this.camera)
    // add light
    this.light = new THREE.DirectionalLight(0xffffff)
    this.light.position.set(0, 1, 1).normalize()
    this.scene.add(this.light)

    // Setup loading manager
    this.loadingManager = new THREE.LoadingManager()
    this.loadingManager.onProgress = (item, loaded, total) => {
      console.log(item, loaded, total)
    }
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

  // /////////////////////////////////
  // RENDER
  // /////////////////////////////////
  renderScene() {
    window.requestAnimationFrame(this.renderScene.bind(this))
    if (this.arStatus === 'ready' && this.renderer && typeof this.renderer.render === 'function') {
      this.renderer.render(this.scene, this.camera)
      this.renderARToolkit()
    }
  }

  render() {
    let classes = 'arjs-view'
    if (this.props.hideCamera) classes += ' hide-camera'
    return (
      <div className={classes} ref={(ref) => { this.el = ref }}>
        {/* <canvas className="canvas-video" data-ref="canvasVideo" /> */}
        <canvas className="canvas-overlay" data-ref="canvasOverlay" />
      </div>
    )
  }
}

ARJSView.propTypes = {
  hideCamera: PropTypes.bool,
  showDots: PropTypes.bool,
  showSmooth: PropTypes.bool,
  markerImg: PropTypes.string,
}

export default ARJSView
