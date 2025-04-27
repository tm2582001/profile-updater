import resolve, {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'index.js', // your main file
  output: {
    file: 'dist/bundle.js', // bundled output
    format: 'cjs',          // commonjs (for Node.js apps)
  },
  plugins: [
    resolve({
      preferBuiltins: true, // if importing 'fs', 'path' etc, prefer node built-in
    }),
    nodeResolve({
      jsnext: true
    }),
    commonjs({
       include: [ "./index.js", "node_modules/**" ], 
       ignoreGlobal: false, // Default: false

      // if false then skip sourceMap generation for CommonJS modules
      sourceMap: false // Default: true
    }),
  ],
  external: [
    'fs', 
    'fs/promises', 
    'path', 
    'url', 
    /node_modules/
  ], // (you can add 'fs', 'path' here if needed)
};