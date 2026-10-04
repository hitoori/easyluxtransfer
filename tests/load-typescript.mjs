import { readFileSync } from 'node:fs'
import ts from 'typescript'

// Resolve local TypeScript dependencies for real rule tests without a browser.
export function typescriptModule(file, preview = true) {
  const source = readFileSync(file, 'utf8').replaceAll('import.meta.env.DEV', String(preview))
  let js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  js = js.replace(/from\s+(['"])(\.\.?\/[^'"]+)\1/g, (match, quote, specifier) => {
    const dependency = new URL(`${specifier}.ts`, file)
    return `from ${JSON.stringify(typescriptModule(dependency, preview))}`
  })
  return `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`
}
