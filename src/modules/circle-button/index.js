import React from 'react'
import Base from 'modules/module-base'
import './style.scss'


class CircleBtn extends Base {
  constructor() {
    super()
    this.setDefaults()
  }

  setDefaults() {
    this.state = {
      isDown: false
    }
  }

  componentDidMount() {
    super.componentDidMount()
    this.setBinds()
  }

  setBinds() {}

  get classes() {
    const classes = []
    if (this.state.isDown) classes.push('down')
    return classes
  }

  onDown = () => {
    this.setState({ isDown: true })
  }

  onUp = () => {
    this.setState({ isDown: false })
  }

  onClick = () => {
    if (this.props.onClick instanceof Function) {
      this.props.onClick()
    }
  }

  render = () => {
    const classes = ['circle-btn', ...this.classes]
    if (this.props.className) classes.push(this.props.className)
    return (
      <div
        onClick={this.onClick}
        onMouseDown={this.onDown}
        onTouchStart={this.onDown}
        onMouseUp={this.onUp}
        onTouchEnd={this.onUp}
        onTouchCancel={this.onUp}
        className={classes.join(' ')}
        data-ref="circleBtn"
      >
        <div className="circle-btn-inner" />
      </div>
    )
  }
}

export default CircleBtn
