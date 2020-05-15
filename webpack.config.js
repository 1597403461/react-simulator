const webpack = require('webpack');
const path = require('path');
const HtmlwebpackPlugin = require('html-webpack-plugin');

var config = {
    entry: [
        './src/index.1.js',
        // './src/index.2.js',
        // './src/index.3.js',
        // './src/index.4.js',
        // './src/index.js',
    ], // 入口文件
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    }, // 打包输出文件
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [
                    { loader: 'babel-loader' }
                ]
            }
        ]
    },
    plugins: [
        new HtmlwebpackPlugin({
            title: 'Hello React',
            template: './src/index.html'
        }),
    ]
};
module.exports = config;