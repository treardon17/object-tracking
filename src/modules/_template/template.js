import React from 'react'
import Base from '../module-base'
import './template.scss'


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
