import React from 'react'
import Base from 'modules/module-base'
import './style.scss'
const { THREE } = window


class Template extends Base {
  componentDidMount() {
    super.componentDidMount()
    this.setup()
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
    this.sceneItems = {}
  }


  setBinds() {
    window.addEventListener('resize', this.onResize.bind(this))
  }

  setScene() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.refs.arOverlay,
      antialias: true,
      alpha: true
    })
    this.renderer.setClearColor(new THREE.Color('lightgrey'), 0)
    this.renderer.setSize(this.width, this.height)

    this.scene = new THREE.Scene()
    this.camera = new THREE.Camera()
    this.scene.add(this.camera)
    this.scene.visible = false

    this.addCube({ name: 'cube' })
  }

  setARToolkit() {
    return new Promise((resolve, reject) => {
      this.arToolkitSource = new THREEx.ArToolkitSource({ source: 'webcam' })
      this.arToolkitSource.init(() => {
        this.onResize()
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
      patternUrl: '/assets/data/patt.hiro',
      changeMatrixMode: 'cameraTransformMatrix'
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

  renderARToolkit() {
    if (this.arToolkitSource.ready === false) return
    this.arToolkitContext.update(this.arToolkitSource.domElement)
    this.scene.visible = this.camera.visible
  }

  renderScene() {
    const fps = 60
    setTimeout(() => { requestAnimationFrame(this.renderScene.bind(this)) }, 1000 / fps)
    this.renderARToolkit()
    if (!this.renderCount) this.renderCount = 0
    else this.renderCount += 1
    if (this.renderCount % 500 === 0) this.renderer.render(this.scene, this.camera)
  }

  onResize() {
    this.arToolkitSource.onResize()
    this.arToolkitSource.copySizeTo(this.renderer.domElement)
    if (this.arToolkitContext && this.arToolkitContext.arController !== null) {
      this.arToolkitSource.copySizeTo(this.arToolkitContext.arController.canvas)
    }
  }

  render() {
    return (
      <div className="arjs-view">
        <canvas data-ref="arOverlay" />
      </div>
    )
  }
}

export default Template
