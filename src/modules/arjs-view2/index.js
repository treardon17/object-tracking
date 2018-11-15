import React from 'react'
import Base from 'modules/module-base'
/* eslint-disable */
import { LoaderUtils } from 'three'
const { THREE } = window
THREE.LoaderUtils = LoaderUtils
import 'three/examples/js/loaders/OBJLoader'
import 'three/examples/js/loaders/GLTFLoader'
import 'three/examples/js/loaders/ColladaLoader'
import './style.scss'
/* eslint-enable */

console.log(LoaderUtils)

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
    this.fps = 60
    this.time = Date.now()
    this.prevTime = Date.now()
    this.sceneItems = {}
    this.mixers = {}
  }


  setBinds() {
    window.addEventListener('resize', this.onResize.bind(this))
  }

  setScene() {
    // renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.refs.arOverlay,
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
    // light
    this.light = new THREE.DirectionalLight(0xffffff)
    this.light.position.set(0, 1, 1).normalize()
    this.scene.add(this.light)
    this.scene.visible = false

    // this.addHorse({ name: 'hidalgo' })
    this.addStormTrooper({ name: 'vader' })
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
    this.scene.visible = this.camera.visible
  }

  renderScene() {
    setTimeout(() => { requestAnimationFrame(this.renderScene.bind(this)) }, 1000 / this.fps)
    this.renderARToolkit()
    if (!this.renderCount) this.renderCount = 0
    else this.renderCount += 1
    if (this.renderCount % 500 === 0) this.renderer.render(this.scene, this.camera)
    this.renderMixers()
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