import { observable, computed } from 'mobx'

class AppState {
  @observable browserWindow = { ...this.windowSpecs }

  constructor() {
    this.setBinds()
  }

  get windowSpecs() {
    const width = window.innerWidth
    const height = window.innerHeight
    return {
      width,
      height,
      widthPx: `${width}px`,
      heightPx: `${height}px`,
    }
  }

  setBinds() {
    window.addEventListener('resize', this.windowResize.bind(this))
  }

  windowResize() {
    this.browserWindow = {
      ...this.windowSpecs
    }
  }

  fetchData(query) {
    fetch(query).then(response => response.json())
      .then((response) => {
        this.user = response
      })
  }

  @computed get fullName() {
    const name = `${this.user.first_name} ${this.user.last_name}`
    return name
  }
}

export default new AppState()
