import {defineConfig} from 'vite';
import {extensionManifestPlugin} from '@kubohiroya/turbowarp-extension-manifest';
import {turboWarpExtension} from '@kubohiroya/vite-plugin-turbowarp-extension';
import definitions from './src/block-definitions.json' with { type: 'json' };
import {extensionConfig} from './src/config.js';

export default defineConfig({
  // zxing-cpp's WebAssembly is inlined into the bundle (`?inline`), so Vite has to treat it as an asset.
  assetsInclude: ['**/*.wasm'],
  plugins: [
    turboWarpExtension({
      id: extensionConfig.id,
      name: extensionConfig.name,
      description: extensionConfig.description,
      author: extensionConfig.author,
      license: extensionConfig.license,
      fileName: `${extensionConfig.slug}.js`
    }),
    extensionManifestPlugin({
      id: extensionConfig.id,
      definitions
    })
  ]
});
