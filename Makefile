.PHONY: setup build

## プロジェクトをcloneしたあと、はじめに実行する
setup:
	npm install -g uglify-es json-minify less less-plugin-clean-css
	npm install
	apm install language-babel atom-beautify
	npm -g install js-beautify

## リリース版ファイルを作成する
build:
	if [ ! -d target ]; then mkdir target; fi
	cp -r img _locales target/
	cp newtab.html target/
	npm run build
	mv target/main.min.js target/main.js
	uglifyjs --compress --mangle --output target/main.min.js target/main.js
	rm target/main.js
	lessc --clean-css styles.less target/styles.min.css
	json-minify manifest.json > target/manifest.json
