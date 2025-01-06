import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    '.vscode',
    'packages',
    'playground',
  ],
}, {
  rules: {
    'import/extensions': ['error', 'ignorePackages'],
  },
})
