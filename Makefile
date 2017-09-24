.PHONY: setup build

## プロジェクトをcloneしたあと、はじめに実行する
setup:
	npm install -g uglify-es json-minify less less-plugin-clean-css
	npm install
	apm install language-babel atom-beautify
	npm -g install js-beautify

## デバッグ用ビルド
dev:
	if [ ! -d target ]; then mkdir target; fi
	cp -r img _locales target/
	cp newtab.html target/
	json-minify manifest.json > target/manifest.json
	lessc --clean-css styles.less target/styles.min.css
	npm run dev

## リリース版ファイルを作成する
build:
	if [ ! -d target ]; then mkdir target; fi
	cp -r img _locales target/
	cp newtab.html target/
	json-minify manifest.json > target/manifest.json
	lessc --clean-css styles.less target/styles.min.css
	npm run build
	mv target/main.min.js target/main.js
	uglifyjs --compress --mangle --output target/main.min.js target/main.js
	rm target/main.js
