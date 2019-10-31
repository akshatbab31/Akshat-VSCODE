/**************************************************************************
*
*  Copyright 1998 - 2018 Adobe Systems Incorporated
*  All Rights Reserved.
*
**************************************************************************/

const gulp = require('gulp');
const path = require('path');

const ts = require('gulp-typescript');
const typescript = require('typescript');
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');
const runSequence = require('run-sequence');
const es = require('event-stream');
const vsce = require('vsce');
const nls = require('vscode-nls-dev');
const tslint = require("gulp-tslint");
const log = require('gulp-util').log;
const filter = require('gulp-filter');

const tsProject = ts.createProject('src/tsconfig.json', { typescript });

const inlineMap = true;
const inlineSource = false;
const outDest = 'dist';
const watchedSources = [
	'src/**/*'
];

const languages = 	[{ folderName: 'de_DE', id: 'de' }, { folderName: 'fr_FR', id: 'fr' },
				   	 { folderName: 'it_IT', id: 'it' },{ folderName: 'ja_JP', id: 'ja' },
					 { folderName: 'es_ES', id: 'es' }, { folderName: 'en_US', id: 'en' }
					];

gulp.task('default', function(callback) {
	runSequence('build', callback);
});

gulp.task('watch', ['internal-nls-compile', 'add-package-json-i18n'], function(cb) {
	log('Watching build sources...');
	gulp.watch(watchedSources, ['internal-nls-compile', 'add-package-json-i18n']);
});

gulp.task('compile', function(callback) {
	runSequence('clean', 'internal-compile', callback);
});

gulp.task('build', function(callback) {
	runSequence('clean', 'internal-nls-compile', 'add-package-json-i18n', callback);
});

gulp.task('publish', function(callback) {
	runSequence('build', 'vsce:publish', callback);
});

gulp.task('package', function(callback) {
	runSequence('build', 'vsce:package', callback);
});

gulp.task('clean', function() {
	return del(['dist/**', 'extendscript-debug*.vsix', 'package.nls.??.json']);
})

var allTypeScript = [
	'src/**/*.ts'
];

var tslintFilter = [
	'**',
	'!**/*.d.ts'
];

gulp.task('tslint', function () {
	gulp.src(allTypeScript)
	.pipe(filter(tslintFilter))
	.pipe(tslint({
		formatter: "verbose",
		rulesDirectory: "src/"
	}))
	.pipe(tslint.report( {
		emitError: false
	}))
});

function compile(buildNls) {
	var r = tsProject.src()
		.pipe(sourcemaps.init())
		.pipe(tsProject()).js
		.pipe(buildNls ? nls.rewriteLocalizeCalls() : es.through())
		.pipe(buildNls ? nls.createAdditionalLanguageFiles(languages, 'i18n', 'dist') : es.through());

	if (inlineMap && inlineSource) {
		r = r.pipe(sourcemaps.write());
	} else {
		r = r.pipe(sourcemaps.write("../dist", {
			includeContent: inlineSource,
			sourceRoot: "../src"
		}));
	}

	return r.pipe(gulp.dest(outDest));
}

gulp.task('internal-compile', function() {
	return compile(false);
});

gulp.task('internal-nls-compile', function() {
	return compile(true);
});

gulp.task('vsce:publish', function() {
	return vsce.publish();
});

gulp.task('vsce:package', function() {
	return vsce.createVSIX();
});

gulp.task('add-package-json-i18n', function() {
	return gulp.src(['package.nls.json'])
		.pipe(nls.createAdditionalLanguageFiles(languages, 'i18n'))
		.pipe(gulp.dest('.'));
});
