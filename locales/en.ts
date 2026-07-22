// locales/en.ts

export const en = {
  'header.title': 'JSON Formatter',
  'header.subtitle': 'Runs entirely in your browser',

  'status.valid': 'Valid JSON',
  'status.invalid': 'Invalid JSON',

  'toolbar.format': 'Format',
  'toolbar.minify': 'Minify',
  'toolbar.sortKeys': 'sort keys',
  'toolbar.loadSample': 'Load sample',
  'toolbar.copy': 'Copy',
  'toolbar.download': 'Download',
  'toolbar.clear': 'Clear',
  'toolbar.treeView': 'Tree view',
  'toolbar.clearall': 'Clear all',


  'editor.label': 'Editor',
  'editor.loading': 'Loading editor…',

  'tree.label': 'Tree view',
  'tree.empty': 'empty',
  'tree.emptyState': 'Nothing to inspect yet — paste or load some JSON.',
  'tree.fixError': 'Fix the syntax error to inspect the tree.',
  'tree.sort': 'Sort keys',
  'tree.copy' : "Copy",
  'tree.download' : "download",
  'tree.clear' : "Clear",


  'error.title': 'Invalid JSON',

  'toast.copied': 'Copied to clipboard',
  'toast.copyEmpty': 'Nothing to copy yet',
  'toast.copyFailed': 'Copy failed — check clipboard permissions',
  'toast.downloadEmpty': 'Nothing to download yet',
  'toast.downloaded': 'Downloaded {filename}',

  'theme.toLight': 'Switch to light mode',
  'theme.toDark': 'Switch to dark mode',



  'lang.label': 'Language',
} as const

export type TranslationKey = keyof typeof en