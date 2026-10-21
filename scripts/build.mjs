import {build} from 'esbuild';
await build({entryPoints:['src/cloud-client.js'],bundle:true,platform:'browser',format:'iife',target:['chrome110','safari16'],outfile:'dist/cloud-client.js',minify:true,legalComments:'eof'});
