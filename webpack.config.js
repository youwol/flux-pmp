const path = require('path');
const webpack = require('webpack');
const pkg = require('./package.json');
const ROOT = path.resolve(__dirname, 'src');
const DESTINATION = path.resolve(__dirname, 'dist');

module.exports = {
    context: ROOT,
    entry: {
        'main': './index.ts'
    },
    output: {
        path: DESTINATION,
        libraryTarget: 'umd',
        umdNamedDefine: true,
        library: pkg.name,
        filename: pkg.name + ".js",
        globalObject: `(typeof self !== 'undefined' ? self : this)`
    },
    resolve: {
        extensions: ['.ts', 'tsx', '.js'],
        modules: [
            ROOT,
            'node_modules'
        ]
    },
    externals: [{
        'rxjs': "rxjs",
        'rxjs/operators': {
            commonjs:'rxjs/operators',
            commonjs2:'rxjs/operators',
            root:['rxjs','operators']
        },
        '@youwol/flux-core': "@youwol/flux-core",
        '@youwol/cdn-client': '@youwol/cdn-client',
        '@youwol/flux-view': "@youwol/flux-view",
        '@youwol/flux-three': "@youwol/flux-three",
        'three': {
            commonjs:'three',
            commonjs2:'three',
            root:['THREE']
        },
        "three-trackballcontrols": {
            commonjs:"three-trackballcontrols",
            commonjs2:"three-trackballcontrols",
            root:["TrackballControls"]
        }
    }],
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    { loader: 'ts-loader' },
                  ],
                  exclude: /node_modules/,
            }
        ],
    },
    devtool: 'source-map'
};