// include gulp
var gulp = require('gulp');

// include plug-ins
var jshint = require('gulp-jshint'),
  changed = require('gulp-changed'),
  imagemin = require('gulp-imagemin'),
  concat = require('gulp-concat'),
  stripDebug = require('gulp-strip-debug'),
  uglify = require('gulp-uglify'),
  autoprefix = require('gulp-autoprefixer'),
  minifyCSS = require('gulp-minify-css'),
  rimraf = require('gulp-rimraf'),
  browserSync = require("browser-sync"),
  wiredep = require('wiredep').stream,
  path = require('path'),
  url = require('url'),
  proxy = require('proxy-middleware');

var request = require('request');
var fs = require('fs');

//Sources
var htmlSrc = 'assets/*.html',
  htmlDst = 'assets';
var imgSrc = 'src/img/**/*',
  imgDst = 'assets/img';
var jsSrc = ['libs/*.js', 'src/js/libs/*.js', 'src/js/*.js'],
  jsDst = 'assets/js/';
var cssSrc = ['libs/*.css', 'src/css/libs/*.css', 'src/css/**/*.css', 'src/css/*.css'],
  cssDst = './assets/css/';
var fontSrc = ['./assets/fonts/', 'bower_components/components-font-awesome/fonts/*'],
  fontDst = './assets/fonts/';

var bowerDest = 'libs';

/*Connecting BrowserSync ...*/
var server = {
  start: function() {
    var proxyOptions = url.parse('http://localhost:8012/rest');
    proxyOptions.route = '/rest';

    browserSync({
      server: {
        baseDir: "./",
        middleware: [proxy(proxyOptions)]
      }
    });
  }
}

/* Bower */
/* 
Comannds:
  $ bower install --save plugin-name
  $ gulp bower
*/
gulp.task('bower', function() {
  gulp.src('./*.html')
    .pipe(wiredep())
    .pipe(gulp.dest('./'));
});

//Fonts
gulp.task('fonts', function() {
  return gulp.src(fontSrc)
    .pipe(gulp.dest(fontDst));
});

/*
================================
      Gulp development
================================
*/

// CSS concat, auto-prefix and minify
gulp.task('styles-dev', function() {
  return gulp.src(cssSrc)
    .pipe(concat('styles.css'))
    .pipe(gulp.dest(cssDst));
});

// JS hint task
gulp.task('jshint', function() {
  return gulp.src('src/js/')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// JS concat, strip debugging and minify
gulp.task('scripts-dev', function() {
  return gulp.src(jsSrc)
    .pipe(concat('libs.js'))
    .pipe(gulp.dest(jsDst));
});

//Minify images
gulp.task('imagemin-dev', function() {
  return gulp.src(imgSrc)
    .pipe(changed(imgDst))
    .pipe(gulp.dest(imgDst));
});

/*
================================
      Gulp production
================================
*/

// Deletes the assets folder
gulp.task('clean', function(cb) {
  return gulp.src('./assets')
    .pipe(rimraf({ force: true }));
});

// CSS concat, auto-prefix and minify
gulp.task('styles-prod', function() {
  return gulp.src(cssSrc)
    .pipe(concat('styles.css'))
    .pipe(autoprefix('last 2 versions'))
    .pipe(minifyCSS())
    .pipe(gulp.dest(cssDst));
});

// JS  striping the console, concatenate and uglify it
gulp.task('scripts-prod', function() {
  return gulp.src(jsSrc)
    .pipe(concat('libs.js'))
    .pipe(stripDebug())
    .pipe(uglify())
    .pipe(gulp.dest(jsDst));
});

//Minify images
gulp.task('imagemin-prod', function() {
  return gulp.src(imgSrc)
    .pipe(changed(imgDst))
    .pipe(imagemin())
    .pipe(gulp.dest(imgDst));
});

// Development task
gulp.task('default', ['styles-dev', 'jshint', 'scripts-dev', 'imagemin-dev', 'fonts'], function() {
  server.start();

  // watch for JS changes
  gulp.watch(jsSrc, ['scripts-dev', 'jshint', browserSync.reload]);

  // watch for CSS changes
  gulp.watch(cssSrc, ['styles-dev', browserSync.reload]);

  // watch for IMAGES changes
  gulp.watch(imgSrc, ['imagemin-prod', browserSync.reload]);

  // watch for FONT changes
  gulp.watch(fontSrc, ['fonts', browserSync.reload]);

  // watch for HTML changes
  gulp.watch(['*.html']).on('change', function(file) {
    browserSync.reload();
  });
});

// Production task
gulp.task('prod', ['styles-prod', 'scripts-prod', 'imagemin-prod', 'fonts'], function() {
  server.start();
});
