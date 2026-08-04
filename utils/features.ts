// utils/features.ts
// Static catalogue of the app's features, grouped by category. Powers the
// "Help" menu in app.vue. Stores translation keys (not literal text) so the
// menu follows the active locale — resolve each with useLocale()'s t().

import type { TranslationKey } from '~/locales/en'

export interface FeatureItem {
  labelKey: TranslationKey
  descKey: TranslationKey
}

export interface FeatureGroup {
  titleKey: TranslationKey
  items: FeatureItem[]
}

export const featureGroups: FeatureGroup[] = [
  {
    titleKey: 'help.group.viewModes',
    items: [
      { labelKey: 'help.tree.label', descKey: 'help.tree.desc' },
      { labelKey: 'help.text.label', descKey: 'help.text.desc' },
      { labelKey: 'help.table.label', descKey: 'help.table.desc' },
      { labelKey: 'help.code.label', descKey: 'help.code.desc' },
      { labelKey: 'help.yaml.label', descKey: 'help.yaml.desc' },
      { labelKey: 'help.csv.label', descKey: 'help.csv.desc' },
      { labelKey: 'help.schema.label', descKey: 'help.schema.desc' },
    ],
  },
  {
    titleKey: 'help.group.formatValidate',
    items: [
      { labelKey: 'help.format.label', descKey: 'help.format.desc' },
      { labelKey: 'help.minify.label', descKey: 'help.minify.desc' },
      { labelKey: 'help.sortKeys.label', descKey: 'help.sortKeys.desc' },
      { labelKey: 'help.indentSize.label', descKey: 'help.indentSize.desc' },
      { labelKey: 'help.escapeUnescape.label', descKey: 'help.escapeUnescape.desc' },
    ],
  },
  {
    titleKey: 'help.group.searchFilter',
    items: [
      { labelKey: 'help.search.label', descKey: 'help.search.desc' },
      { labelKey: 'help.jmespath.label', descKey: 'help.jmespath.desc' },
    ],
  },
  {
    titleKey: 'help.group.dataActions',
    items: [
      { labelKey: 'help.copy.label', descKey: 'help.copy.desc' },
      { labelKey: 'help.download.label', descKey: 'help.download.desc' },
      { labelKey: 'help.clear.label', descKey: 'help.clear.desc' },
      { labelKey: 'help.loadSample.label', descKey: 'help.loadSample.desc' },
    ],
  },
  {
    titleKey: 'help.group.compare',
    items: [
      { labelKey: 'help.diffMode.label', descKey: 'help.diffMode.desc' },
      { labelKey: 'help.uploadRight.label', descKey: 'help.uploadRight.desc' },
      { labelKey: 'help.formatRight.label', descKey: 'help.formatRight.desc' },
    ],
  },
  {
    titleKey: 'help.group.historySharing',
    items: [
      { labelKey: 'help.saveHistory.label', descKey: 'help.saveHistory.desc' },
      { labelKey: 'help.restoreHistory.label', descKey: 'help.restoreHistory.desc' },
      { labelKey: 'help.shareLink.label', descKey: 'help.shareLink.desc' },
    ],
  },
  {
    titleKey: 'help.group.appearance',
    items: [
      { labelKey: 'help.lightDark.label', descKey: 'help.lightDark.desc' },
      { labelKey: 'help.themePreset.label', descKey: 'help.themePreset.desc' },
      { labelKey: 'help.codeColor.label', descKey: 'help.codeColor.desc' },
      { labelKey: 'help.font.label', descKey: 'help.font.desc' },
    ],
  },
  {
    titleKey: 'help.group.other',
    items: [
      { labelKey: 'help.language.label', descKey: 'help.language.desc' },
      { labelKey: 'help.fullscreen.label', descKey: 'help.fullscreen.desc' },
    ],
  },
]
