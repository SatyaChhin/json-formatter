// locales/km.ts
import type { TranslationKey } from './en'

export const km = {
  'header.title': 'កម្មវិធីរៀបចំទម្រង់ JSON',
  'header.subtitle': 'ដំណើរការទាំងស្រុងក្នុងកម្មវិធីរុករករបស់អ្នក — គ្មានទិន្នន័យផ្ទុកឡើងទេ',

  'status.valid': 'JSON ត្រឹមត្រូវ',
  'status.invalid': 'JSON មិនត្រឹមត្រូវ',

  'toolbar.format': 'រៀបទម្រង់',
  'toolbar.minify': 'បង្រួម',
  'toolbar.sortKeys': 'តម្រៀបគន្លឹះ',
  'toolbar.loadSample': 'ផ្ទុកគំរូ',
  'toolbar.copy': 'ចម្លង',
  'toolbar.download': 'ទាញយក',
  'toolbar.clear': 'សម្អាត',
  'toolbar.treeView': 'ទិដ្ឋភាពមែកធាង',

  'editor.label': 'កម្មវិធីនិពន្ធ',
  'editor.loading': 'កំពុងផ្ទុកកម្មវិធីនិពន្ធ…',

  'tree.label': 'ទិដ្ឋភាពមែកធាង',
  'tree.empty': 'ទទេ',
  'tree.emptyState': 'មិនទាន់មានអ្វីត្រូវពិនិត្យទេ — សូមបិទភ្ជាប់ ឬផ្ទុក JSON។',
  'tree.fixError': 'សូមកែកំហុសវាក្យសម្ព័ន្ធសិន ដើម្បីមើលមែកធាង។',

  'tree.sort': 'Sort keys',
  'tree.copy' : "Copy",
  'tree.download' : "download",
  'tree.clear' : "Clear",

  'error.title': 'JSON មិនត្រឹមត្រូវ',

  'toast.copied': 'បានចម្លងទៅក្ដារតម្បៀតខ្ទាស់',
  'toast.copyEmpty': 'មិនទាន់មានអ្វីត្រូវចម្លងទេ',
  'toast.copyFailed': 'ចម្លងបរាជ័យ — សូមពិនិត្យសិទ្ធិក្ដារតម្បៀតខ្ទាស់',
  'toast.downloadEmpty': 'មិនទាន់មានអ្វីត្រូវទាញយកទេ',
  'toast.downloaded': 'បានទាញយក {filename}',

  'theme.toLight': 'ប្តូរទៅរបៀបភ្លឺ',
  'theme.toDark': 'ប្តូរទៅរបៀបងងឹត',

  'lang.label': 'ភាសា',
} satisfies Record<TranslationKey, string>
