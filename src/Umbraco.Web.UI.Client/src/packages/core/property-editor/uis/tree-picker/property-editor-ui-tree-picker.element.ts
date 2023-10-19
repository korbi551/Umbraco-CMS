import { html, customElement, property } from '@umbraco-cms/backoffice/external/lit';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import { UmbPropertyEditorUiElement } from '@umbraco-cms/backoffice/extension-registry';
import { UmbLitElement } from '@umbraco-cms/internal/lit-element';
import { UmbPropertyEditorConfigCollection } from '@umbraco-cms/backoffice/property-editor';
import { UmbInputTreeElement } from '@umbraco-cms/backoffice/components';

/**
 * @element umb-property-editor-ui-tree-picker
 */

@customElement('umb-property-editor-ui-tree-picker')
export class UmbPropertyEditorUITreePickerElement extends UmbLitElement implements UmbPropertyEditorUiElement {
	@property()
	value = '';

	#configuration?: UmbPropertyEditorConfigCollection;

	@property({ attribute: false })
	public set config(config: UmbPropertyEditorConfigCollection | undefined) {
		this.#configuration = config;
	}

	#onChange(e: CustomEvent) {
		this.value = (e.target as UmbInputTreeElement).items.join(',');
		this.dispatchEvent(new CustomEvent('property-value-change'));
	}

	render() {
		return html`${this.value}<umb-input-tree
				.configuration=${this.#configuration}
				@change=${this.#onChange}></umb-input-tree>`;
	}

	static styles = [UmbTextStyles];
}

export default UmbPropertyEditorUITreePickerElement;

declare global {
	interface HTMLElementTagNameMap {
		'umb-property-editor-ui-tree-picker': UmbPropertyEditorUITreePickerElement;
	}
}
