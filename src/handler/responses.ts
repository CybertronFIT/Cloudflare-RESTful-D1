// copyright 2023 © Xron Trix | https://github.com/Xrontrix10

const headers = new Headers({
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE',
	'Access-Control-Allow-Headers': 'Content-Type, Origin, X-Auth-Token, Authorization',
	'Connection': 'Keep-Alive'
});

export function serverRoot(): Response {
	return new Response('Server is up and running!', {
		status: 200,
		headers,
	});
}

export function returnJson(data: any): Response {
	const headers = new Headers({
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE',
		'Access-Control-Allow-Headers': 'Content-Type, Origin, X-Auth-Token, Authorization',
		'Connection': 'Keep-Alive',
		'Content-Type': 'application/json'
	});

	return new Response(data, {
		status: 200,
		headers,
	});
}

export function noContent(): Response {
	return new Response(null, { status: 204, headers });
}

export function badRequest(): Response {
	return new Response('Bad Request', { status: 400, headers });
}

export function notAuthorized(): Response {
	return new Response('Unauthorized', { status: 401, headers });
}

export function notFound(): Response {
	return new Response('Not Found', { status: 404, headers });
}

export function notAllowed(): Response {
	return new Response('Method not Allowed', { status: 405, headers });
}

export function dataConflict(): Response {
	return new Response('Data conflicts with current resource', { status: 409, headers });
}

export function badEntity(): Response {
	return new Response('Unprocessable Entity', { status: 422, headers });
}

export function serverError(): Response {
	return new Response('Internal Server error', { status: 500, headers });
}
