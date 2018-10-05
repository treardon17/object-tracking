import React from 'react'
import Base from 'modules/module-base'
import './style.scss'


class Template extends Base {
  componentDidMount() {
    super.componentDidMount()
    this.setDefaults()
    this.setBinds()
  }

  setDefaults() {}
  setBinds() {}
  render() {}
}

export default Template
