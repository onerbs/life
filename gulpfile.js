const { src, dest, series } = require('gulp')

const clean = require('gulp-clean')
const minify = require('gulp-minify')

const js_minify = () =>
  src('life.js')
    .pipe(minify({
      ext: {
        min: '.min.js'
      },
      mangle: {
        eval: true,
        toplevel: true
      }
    })).pipe(dest('dist'))

const js_clean = () =>
  src(['life.js', 'dist/life.js'], { read: false })
    .pipe(clean())

exports.default = series(
  js_minify,
  js_clean
)
