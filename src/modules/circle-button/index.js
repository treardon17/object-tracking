import React from 'react'
import Base from 'modules/module-base'
import ReactSVG from 'react-svg'
import { TimelineLite } from 'gsap'
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
    this.timeline = null
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

  get icon() {
    return this.props.icon
      ? (
        <ReactSVG
          className="button-icon-wrapper"
          svgClassName="button-icon"
          src={this.props.icon}
        />
      )
      : null
  }

  show = (show = true, { onComplete } = {}) => {
    const { content, $el } = this.refs

    // styles
    const styles = getComputedStyle(content)
    let { width, marginLeft, marginRight } = styles
    width = parseFloat(width)
    marginLeft = parseFloat(marginLeft)
    marginRight = parseFloat(marginRight)
    const totalWidth = width + marginLeft + marginRight

    // start timeline
    if (this.timeline) this.timeline.kill()
    this.timeline = new TimelineLite({
      onComplete
    })
    const widthVars = {
      from: { width: show ? 0 : totalWidth },
      to: { width: show ? totalWidth : 0 }
    }
    const alphaVars = {
      from: { autoAlpha: show ? 0 : 1 },
      to: { autoAlpha: show ? 1 : 0 }
    }
    if (show) {
      this.timeline
        .fromTo($el, 0.33, widthVars.from, widthVars.to)
        .fromTo($el, 0.33, alphaVars.from, alphaVars.to)
    } else {
      this.timeline
        .fromTo($el, 0.33, alphaVars.from, alphaVars.to)
        .fromTo($el, 0.33, widthVars.from, widthVars.to)
    }
  }

  hide = () => {
    this.show(false)
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
    if (this.props.href && this.link) {
      this.link.click()
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
      >
        {this.props.href ? <a ref={ref => this.link = ref} href={this.props.href} download={this.props.download} /> : null}
        <div className="circle-btn-content" data-ref="content">
          <div className="circle-btn-inner">
            {this.icon}
          </div>
        </div>
      </div>
    )
  }
}

export default CircleBtn
