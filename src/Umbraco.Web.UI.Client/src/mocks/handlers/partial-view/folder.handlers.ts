const { rest } = window.MockServiceWorker;
import { umbPartialViewMockDB } from '../../data/partial-view/partial-view.db.js';
import { UMB_SLUG } from './slug.js';
import { CreatePathFolderRequestModel } from '@umbraco-cms/backoffice/backend-api';
import { umbracoPath } from '@umbraco-cms/backoffice/utils';

export const folderHandlers = [
	rest.get(umbracoPath(`${UMB_SLUG}/folder`), (req, res, ctx) => {
		const path = req.url.searchParams.get('path');
		if (!path) return res(ctx.status(400));
		const response = umbPartialViewMockDB.folder.read(path);
		return res(ctx.status(200), ctx.json(response));
	}),

	rest.post(umbracoPath(`${UMB_SLUG}/folder`), async (req, res, ctx) => {
		const requestBody = (await req.json()) as CreatePathFolderRequestModel;
		if (!requestBody) return res(ctx.status(400, 'no body found'));
		umbPartialViewMockDB.folder.create(requestBody);
		return res(ctx.status(200));
	}),

	rest.delete(umbracoPath(`${UMB_SLUG}/folder`), (req, res, ctx) => {
		const path = req.url.searchParams.get('path');
		if (!path) return res(ctx.status(400));
		umbPartialViewMockDB.folder.delete(path);
		return res(ctx.status(200));
	}),
];
