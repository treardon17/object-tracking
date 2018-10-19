import 'jsartoolkit5/js/artoolkit.api'
import '@/libraries/threejs'
import '@/libraries/threex'
import 'three/examples/js/loaders/OBJLoader'
import React from 'react'
import PropTypes from 'prop-types'
import CameraView from 'modules/camera-view'
import Base from 'modules/module-base'
import './style.scss'


class ARView extends Base {
  componentDidMount() {
    super.componentDidMount()
    this.setDefaults()
    // console.log('object loader is', new OBJLoader)
  }


  // /////////////////////////////////
  // SETUP
  // /////////////////////////////////
  setDefaults() {
    this.sceneItems = {}
  }

  setupIfNeeded({ width, height }) {
    if (!this._isSetup) {
      this.width = width
      this.height = height
      this.setup()
    }
  }

  setup() {
    return new Promise((resolve, reject) => {
      this.refs.canvasOverlay.width = this.width
      this.refs.canvasOverlay.height = this.height
      this.createScene()
      this.setupARToolKit().then(() => {
        // this.addCube({ name: 'cube1' })
        this.addMonkey({ name: 'monkey' })
        resolve()
      }).catch(reject)
      this._isSetup = true
    })
  }

  // /////////////////////////////////
  // THREEJS SCENE
  // /////////////////////////////////
  createScene() {
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
  // ARTOOLKIT
  // /////////////////////////////////
  setupARToolKit() {
    return new Promise((resolve, reject) => {
      this.setupARToolKitSource()
        .then(this.setupARToolkitContext.bind(this))
        .then(this.setupMarkerControls.bind(this))
        .then(resolve)
        .catch(reject)
    })
  }

  setupARToolKitSource() {
    return new Promise((resolve) => {
      this.arToolkitSource = new THREEx.ArToolkitSource({
        // // to read from the webcam
        // sourceType: 'webcam',

        // // to read from an image
        // sourceType : 'image',
        // sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/images/img.jpg',

        // to read from a video
        sourceType: 'video',
        sourceUrl: this.cameraView.url
      })
      this.arToolkitSource.init(() => {
        this.arToolkitSource.onResize()
        this.arToolkitSource.domElement.style.visibility = 'hidden'
        resolve()
      })
    })
  }

  setupARToolkitContext() {
    return new Promise((resolve) => {
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

  renderARToolkit() {
    if (this.arToolkitSource.ready === false) return
    this.arToolkitContext.update(this.arToolkitSource.domElement)
    // update scene.visible if the marker is seen
    this.scene.visible = this.camera.visible
  }

  // /////////////////////////////////
  // MARKER CONTROLS
  // /////////////////////////////////
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

  // /////////////////////////////////
  // ACTIONS
  // /////////////////////////////////
  start() { this.cameraView.start() }
  stop() { this.cameraView.stop() }

  // /////////////////////////////////
  // EVENTS
  // /////////////////////////////////
  onCameraUpdate = ({ pixels, canvas, ctx }) => {
    this.setupIfNeeded({ width: canvas.width, height: canvas.height })
    this.renderScene()
  }

  // /////////////////////////////////
  // RENDER
  // /////////////////////////////////
  renderScene() {
    if (this.renderer && typeof this.renderer.render === 'function') {
      this.renderer.render(this.scene, this.camera)
      this.renderARToolkit()
    }
  }

  render() {
    let classes = 'tracking-view'
    if (this.props.hideCamera) classes += ' hide-camera'
    return (
      <div className={classes}>
        <CameraView scale={0.5} onUpdate={this.onCameraUpdate} ref={ref => this.cameraView = ref} />
        <canvas className="canvas-overlay" data-ref="canvasOverlay" />
      </div>
    )
  }
}

ARView.propTypes = {
  hideCamera: PropTypes.bool,
  showDots: PropTypes.bool,
  showSmooth: PropTypes.bool,
  markerImg: PropTypes.string,
}

export default ARView
