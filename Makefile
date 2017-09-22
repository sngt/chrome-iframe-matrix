.PHONY: setup build

## プロジェクトをcloneしたあと、はじめに実行する
setup:
	npm install -g babel-cli uglify-es json-minify less less-plugin-clean-css
	npm install --save-dev babel-plugin-transform-react-jsx
	apm install language-babel atom-beautify
	npm -g install js-beautify

## リリース版ファイルを作成する
build:
	if [ ! -d target ]; then mkdir target; fi
	cp -r img lib _locales target/
	cp newtab.html target/
	babel --plugins transform-react-jsx main.jsx > target/main.js
	uglifyjs --compress --mangle --output target/main.min.js target/main.js
	rm target/main.js
	lessc --clean-css styles.less target/styles.min.css
	json-minify manifest.json > target/manifest.json
