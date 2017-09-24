import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
// import uglify from 'rollup-plugin-uglify-es';

export default {
    input : 'main.jsx',
    output : {
        file: 'target/main.min.js',
        format: 'iife'
    },
    plugins : [
        nodeResolve(),
        replace({'process.env.NODE_ENV': JSON.stringify('production')}),
        commonjs(),
        babel({exclude: 'node_modules/**'})
        // ,uglify()
    ]
};
