import type { ManifestPropertyEditorUi } from '@umbraco-cms/backoffice/extension-registry';

export const manifest: ManifestPropertyEditorUi = {
	type: 'propertyEditorUi',
	alias: 'Umb.PropertyEditorUi.CollectionView.OrderBy',
	name: 'Collection View Column Configuration Property Editor UI',
	js: () => import('./property-editor-ui-collection-view-order-by.element.js'),
	meta: {
		label: 'Collection View Order By',
		propertyEditorSchemaAlias: '',
		icon: 'icon-autofill',
		group: 'lists',
	},
};
