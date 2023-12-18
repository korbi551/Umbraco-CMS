import { RichTextRuleModelSortable, UmbStylesheetWorkspaceContext } from '../../stylesheet-workspace.context.js';
import { UMB_MODAL_TEMPLATING_STYLESHEET_RTF_STYLE_SIDEBAR } from '../../manifests.js';
import { UmbStylesheetRichTextRuleRepository } from '../../../repository/rich-text-rule/index.js';
import { StylesheetRichTextEditorStyleModalValue } from './stylesheet-workspace-view-rich-text-editor-style-sidebar.element.js';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import { UmbLitElement } from '@umbraco-cms/internal/lit-element';
import { UMB_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/workspace';
import { UMB_MODAL_MANAGER_CONTEXT_TOKEN, UmbModalManagerContext, UmbModalToken } from '@umbraco-cms/backoffice/modal';
import { RichTextRuleModel } from '@umbraco-cms/backoffice/backend-api';
import { UmbSorterConfig, UmbSorterController } from '@umbraco-cms/backoffice/sorter';
import { css, html, customElement, state, ifDefined, repeat } from '@umbraco-cms/backoffice/external/lit';

import './stylesheet-workspace-view-rich-text-editor-rule.element.js';

export const UMB_MODAL_TEMPLATING_STYLESHEET_RTF_STYLE_SIDEBAR_MODAL = new UmbModalToken<
	never,
	StylesheetRichTextEditorStyleModalValue
>(UMB_MODAL_TEMPLATING_STYLESHEET_RTF_STYLE_SIDEBAR, {
	modal: {
		type: 'sidebar',
		size: 'medium',
	},
	value: { rule: null },
});

const SORTER_CONFIG: UmbSorterConfig<RichTextRuleModel> = {
	compareElementToModel: (element: HTMLElement, model: RichTextRuleModel) => {
		return element.getAttribute('data-umb-rule-name') === model.name;
	},
	querySelectModelToElement: (container: HTMLElement, modelEntry: RichTextRuleModel) => {
		return container.querySelector('data-umb-rule-name[' + modelEntry.name + ']');
	},
	identifier: 'stylesheet-rules-sorter',
	itemSelector: 'umb-stylesheet-rich-text-editor-rule',
	containerSelector: '#rules-container',
};

@customElement('umb-stylesheet-rich-text-rule-workspace-view')
export class UmbStylesheetRichTextRuleWorkspaceViewElement extends UmbLitElement {
	@state()
	_rules: RichTextRuleModelSortable[] = [];

	#context?: UmbStylesheetWorkspaceContext;
	private _modalContext?: UmbModalManagerContext;

	#stylesheetRichTextRuleRepository = new UmbStylesheetRichTextRuleRepository(this);

	#sorter = new UmbSorterController(this, {
		...SORTER_CONFIG,
		performItemInsert: ({ item, newIndex }) => {
			return this.#context?.findNewSortOrder(item, newIndex) ?? false;
		},
		performItemRemove: () => {
			//defined so the default does not run
			return true;
		},
	});

	constructor() {
		super();

		this.consumeContext(UMB_WORKSPACE_CONTEXT, (workspaceContext) => {
			this.#context = workspaceContext as UmbStylesheetWorkspaceContext;
			const unique = this.#context?.getEntityId();
			this.#setRules(unique);
		});

		this.consumeContext(UMB_MODAL_MANAGER_CONTEXT_TOKEN, (instance) => {
			this._modalContext = instance;
		});
	}

	async #setRules(unique: string) {
		const { data } = await this.#stylesheetRichTextRuleRepository.requestStylesheetRules(unique);

		if (data) {
			this._rules = data.rules ?? [];
			this.#sorter.setModel(this._rules);
		}
	}

	openModal = (rule: RichTextRuleModelSortable | null = null) => {
		if (!this._modalContext) throw new Error('Modal context not found');
		const modal = this._modalContext.open(UMB_MODAL_TEMPLATING_STYLESHEET_RTF_STYLE_SIDEBAR_MODAL, {
			value: {
				rule,
			},
		});
		modal?.onSubmit().then((result) => {
			if (result.rule) {
				this.#context?.setRules([...this._rules, { ...result.rule, sortOrder: this._rules.length }]);
			}
		});
	};

	removeRule = (rule: RichTextRuleModelSortable) => {
		const rules = this._rules?.filter((r) => r.name !== rule.name);
		this.#context?.setRules(rules);
	};

	render() {
		return html` <uui-box headline="Rich text editor styles">
			<div id="box-row">
				<p id="description">Define the styles that should be available in the rich text editor for this stylesheet.</p>
				<div id="rules">
					<div id="rules-container">
						${repeat(
							this._rules,
							(rule) => rule?.name ?? '' + rule?.sortOrder ?? '',
							(rule) =>
								html`<umb-stylesheet-rich-text-editor-rule
									.rule=${rule}
									data-umb-rule-name="${ifDefined(rule?.name)}"></umb-stylesheet-rich-text-editor-rule>`,
						)}
					</div>
					<uui-button label="Add rule" look="primary" @click=${() => this.openModal(null)}>Add</uui-button>
				</div>
			</div>
		</uui-box>`;
	}

	static styles = [
		UmbTextStyles,
		css`
			:host {
				display: block;
				width: 100%;
			}

			#box-row {
				display: flex;
				gap: var(--uui-size-layout-1);
			}

			#description {
				margin-top: 0;
				flex: 0 0 250px;
			}

			#rules {
				flex: 1 1 auto;
				max-width: 600px;
			}

			uui-box {
				margin: var(--uui-size-layout-1);
			}
		`,
	];
}

export default UmbStylesheetRichTextRuleWorkspaceViewElement;

declare global {
	interface HTMLElementTagNameMap {
		'umb-stylesheet-workspace-view-rich-text-editor': UmbStylesheetRichTextRuleWorkspaceViewElement;
	}
}
