var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;
var plumber = require('gulp-plumber');
var csslint = require('gulp-csslint');
var autoPrefixer = require('gulp-autoprefixer');
//if node version is lower than v.0.1.2
require('es6-promise').polyfill();
var cssComb = require('gulp-csscomb');
var cmq = require('gulp-merge-media-queries');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var wiredep = require('wiredep').stream;
var useref = require('gulp-useref');
var httpProxy = require('http-proxy-middleware');
var gulpIf = require('gulp-if');
var uglify = require('gulp-uglify');
var minifyCss = require('gulp-minify-css');
var del = require('del');
var htmlValidator = require('gulp-html');

gulp.task('lint', ['lint:jshint', 'lint:css']);

gulp.task('lint:css', function() {
  return gulp.src(['./src/css/**/*.css'])
    .pipe(csslint())
    .pipe(csslint.formatter(require('csslint-stylish')));
});

gulp.task('lint:jshint', function() {
  return gulp.src(['./src/js/**/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('lint:html', function() {
  return gulp.src(['./*.html'])
    .pipe(htmlValidator());
});

gulp.task('bower', function() {
  return gulp.src(['./*.html'])
    .pipe(wiredep())
    .pipe(gulp.dest('./tmp'));
});

gulp.task('default', function() {
  var restProxy = httpProxy('/rest', {
    target: 'http://localhost:8012',
    logLevel: 'info'
  });

  browserSync.init({
    server: {
      baseDir: './',
      middleware: [restProxy]
    }
  });
  gulp.watch('./src/js/**/*.js', [browserSync.reload]);
  gulp.watch('./src/css/**/*.css', [browserSync.reload]);
  gulp.watch('.//**/*.html').on('change', function(file) {
    browserSync.reload();
  });
  gulp.watch('./src/images/**/*', [browserSync.reload]);
});

gulp.task('clean', ['clean:tmp'], function() {
  return del(['./dist']);
});

gulp.task('clean:tmp', function() {
  return del(['./tmp']);
});

gulp.task('build', ['clean'], function() {
  return gulp.src(['./*.html'])
    .pipe(useref())
    .pipe(gulpIf('*.js', uglify()))
    .pipe(gulpIf('*.css', minifyCss()))
    .pipe(gulp.dest('./dist'));
});
