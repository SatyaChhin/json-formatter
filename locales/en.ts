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
  'toolbar.escape': 'Escape',
  'toolbar.unescape': 'Unescape',


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

  'help.title': 'Features',

  'help.group.viewModes': 'View modes',
  'help.group.formatValidate': 'Format & validate',
  'help.group.searchFilter': 'Search & filter',
  'help.group.dataActions': 'Data actions',
  'help.group.compare': 'Compare',
  'help.group.historySharing': 'History & sharing',
  'help.group.appearance': 'Appearance',
  'help.group.other': 'Other',

  'help.tree.label': 'Tree',
  'help.tree.desc': 'Expandable/collapsible tree of the parsed JSON, with per-node copy, download, and copy-path.',
  'help.text.label': 'Text',
  'help.text.desc': 'Raw formatted JSON in the code editor — the editable source of truth.',
  'help.table.label': 'Table',
  'help.table.desc': 'Tabular view for arrays of flat objects.',
  'help.code.label': 'Code',
  'help.code.desc': 'Read-only syntax-highlighted view of the formatted JSON.',
  'help.yaml.label': 'Yaml',
  'help.yaml.desc': 'Converts the current document to YAML.',
  'help.csv.label': 'Csv',
  'help.csv.desc': 'Converts a tabular array of objects to CSV.',
  'help.schema.label': 'Schema',
  'help.schema.desc': 'Validates the document against a pasted JSON Schema.',

  'help.format.label': 'Format',
  'help.format.desc': 'Beautifies and validates the JSON, reporting the line/column of any syntax error.',
  'help.minify.label': 'Minify',
  'help.minify.desc': 'Collapses the JSON to a single compact line.',
  'help.sortKeys.label': 'Sort keys',
  'help.sortKeys.desc': 'Recursively sorts object keys alphabetically.',
  'help.indentSize.label': 'Indent size',
  'help.indentSize.desc': 'Switches formatting between 2- and 4-space indentation.',
  'help.escapeUnescape.label': 'Escape / Unescape',
  'help.escapeUnescape.desc': 'Wraps the document as a quoted, escaped string literal, or reverses that.',

  'help.search.label': 'Search',
  'help.search.desc': 'Filters Tree/Table/Code/Yaml views to matching text.',
  'help.jmespath.label': 'JMESPath query',
  'help.jmespath.desc': 'Filters the document using a JMESPath expression, e.g. medical_histories[*].value[].',

  'help.copy.label': 'Copy',
  'help.copy.desc': 'Copies the current formatted JSON to the clipboard.',
  'help.download.label': 'Download',
  'help.download.desc': 'Downloads the formatted JSON as a .json file.',
  'help.clear.label': 'Clear',
  'help.clear.desc': 'Empties the editor and resets validation state.',
  'help.loadSample.label': 'Load sample',
  'help.loadSample.desc': 'Loads one of the built-in sample datasets.',

  'help.diffMode.label': 'Diff mode',
  'help.diffMode.desc': 'Side-by-side comparison of the current document against a second, pasted or uploaded document.',
  'help.uploadRight.label': 'Upload right side',
  'help.uploadRight.desc': 'Loads a .json/.txt file into the comparison pane.',
  'help.formatRight.label': 'Format right side',
  'help.formatRight.desc': 'Beautifies the comparison document in place.',

  'help.saveHistory.label': 'Save to history',
  'help.saveHistory.desc': 'Bookmarks a snapshot of the current document (up to 15, stored locally).',
  'help.restoreHistory.label': 'Restore from history',
  'help.restoreHistory.desc': 'Reloads a previously saved snapshot into the editor.',
  'help.shareLink.label': 'Copy shareable link',
  'help.shareLink.desc': 'Compresses the document into the URL hash and copies a link — no backend involved.',

  'help.lightDark.label': 'Light / dark mode',
  'help.lightDark.desc': 'Switches the color scheme; follows the OS preference on first visit.',
  'help.themePreset.label': 'Theme preset',
  'help.themePreset.desc': 'Ledger, Terminal, Signal, or Ember — changes the UI accent and neutral colors.',
  'help.codeColor.label': 'Code color',
  'help.codeColor.desc': 'Classic, Ocean, Sunset, or Mono — changes the JSON string/number/boolean/key colors, independent of the theme preset.',
  'help.font.label': 'Font',
  'help.font.desc': 'Choose the monospace face and size used across the editor and all JSON views.',

  'help.language.label': 'Language',
  'help.language.desc': 'Switches the UI between English and Khmer.',
  'help.fullscreen.label': 'Fullscreen',
  'help.fullscreen.desc': 'Expands the app to fill the browser window.',
} as const

export type TranslationKey = keyof typeof en