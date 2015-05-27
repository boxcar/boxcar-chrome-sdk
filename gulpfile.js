var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    resolveDependencies = require('gulp-resolve-dependencies'),
    concat = require('gulp-concat'),
    jshint = require('gulp-jshint'),
    clean = require('gulp-clean');

gulp.task('default', function() {
  // place code for your default task here
});

gulp.task('min', function () {
    return gulp.src('scripts/*.js')
       .pipe(jshint())
       .pipe(jshint.reporter('default'))
       .pipe(uglify())
       .pipe(concat('boxcar.min.js'))
       .pipe(gulp.dest('build'));
});

gulp.task('js', function () {
    return gulp.src('scripts/*.js')
       .pipe(jshint())
       .pipe(jshint.reporter('default'))
       .pipe(resolveDependencies({
          pattern: /\* @requires [\s-]*(.*\.js)/g
        }))
       .pipe(uglify())
       .pipe(concat('boxcar.bundle.min.js'))
       .pipe(gulp.dest('sample/script'));
});

gulp.task('clean', function() {
    return gulp.src('build', {read: false})
       .pipe(clean());
});
