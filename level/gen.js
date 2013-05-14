
var marked = require('marked').setOptions({
  highlight: require('./index')
})
var fs = require('fs')

module.exports = function (file, l) {

var text = fs.readFileSync(file, 'utf-8')

l('<DOCTYPE html>')
l('<style>')
l(fs.readFileSync('style.css', 'utf-8'))
l('</style>')
l('<style>')
l(fs.readFileSync(__dirname + '/syntax.css', 'utf-8'))
l('</style>')
l('<link rel=stylesheet href=Serif/cmun-serif.css>')
l('<link rel=stylesheet href="Typewriter Light/cmun-typewriter-light.css">')
l(
  marked(text).split(/(<h.*?<\/h.>)/).map(function (e, i, a) {
    if(!(i % 2)) return e

    var close = '', open = ''
    if(i)
      close = '</div>\n'
    if(i !== a.length - 1)
      open = '<div class=slide name=slide'+(i/2)+'>\n'
    return close + open + e
  }).join('') + '</div>'
)
l('<script>')
l(fs.readFileSync(__dirname + '/pages.js', 'utf-8'))
l('</script>')

}

if(!module.parent) {
  var file = process.argv[2]
  var path = require('path')

  function update () {
    var w = fs.createWriteStream('index.html')
    module.exports(file, w.write.bind(w))
    w.end()
  }

  fs.watchFile(path.dirname(file), update)

  update()
}
