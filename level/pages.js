
var slides = [].slice.call(document.querySelectorAll('.slide'))
var current = 0

function show () {
  slides.forEach(function (e, i) {
    e.style.display = current === i ? 'block' : 'none'
  })
}

show()

window.onkeydown = function (e) {
  var ch = ({39: 1, 37: -1})[e.keyCode] || 0
  if(!ch) return
  current = current + ch
  current = Math.min(Math.max(current, 0), slides.length - 1)
  console.log('current slide', current)
  show()
}
