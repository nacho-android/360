AFRAME.components["look-controls"].Component.prototype.onTouchMove = function (t) {
    if (this.touchStarted && this.data.touchEnabled) {
        this.pitchObject.rotation.x += .6 * Math.PI * (t.touches[0].pageY - this.touchStart.y) / this.el.sceneEl.canvas.clientHeight;
        this.yawObject.rotation.y += /*  */ Math.PI * (t.touches[0].pageX - this.touchStart.x) / this.el.sceneEl.canvas.clientWidth;
        this.pitchObject.rotation.x = Math.max(Math.PI / -2, Math.min(Math.PI / 2, this.pitchObject.rotation.x));
        this.touchStart = {
            x: t.touches[0].pageX,
            y: t.touches[0].pageY
        }
    }
}