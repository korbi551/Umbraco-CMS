import type { ManifestPropertyEditorUI } from '@umbraco-cms/models';

export const manifest: ManifestPropertyEditorUI = {
	type: 'propertyEditorUI',
	alias: 'Umb.PropertyEditorUI.ContentPicker',
	name: 'Content Picker Property Editor UI',
	loader: () => import('./property-editor-ui-document-picker.element'),
	meta: {
		label: 'Content Picker',
		propertyEditorModel: 'Umbraco.ContentPicker',
		icon: 'umb:document',
		group: 'common',
		config: {
			properties: [
				{
					alias: 'showOpenButton',
					label: 'Show open button',
					description: 'Opens the node in a dialog',
					propertyEditorUI: 'Umb.PropertyEditorUI.Toggle',
				},
				{
					alias: 'validationLimit',
					label: 'Amount of Documents',
					description: 'Require a certain amount of documents',
					propertyEditorUI: 'Umb.PropertyEditorUI.NumberRange',
				},
			],
		},
	},
};
