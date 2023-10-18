// copyright 2023 © Xron Trix | https://github.com/Xrontrix10

import { Env } from "..";
import { isAuthorized } from "../auth/authenticate";
import { badRequest, serverRoot, noContent } from "./responses";
import { handleRoutes, handleIDRoutes, handleQueryRoutes } from "./routes";

export async function respondRequest(req: Request, env: Env, path: string, search: string, searchParams: any, is_post: boolean, is_get: boolean, is_put: boolean, is_delete: boolean): Promise<Response> {

    if (is_get && path === '/') { // Check If Server is Live
        return serverRoot();
    }
    if (is_get && (path === '/favicon.ico' || path === '/robots.txt')) { // In case any Stupid Opens in Browser ( Like Me :)
        return noContent();
    }

    // ====== Check For Authorization ====== //
    const authResult = isAuthorized(req, env)
    if (authResult) {
        return authResult
    }

    // ====== If authorized, then continue the request ====== //

    if ((path === '/faculties' || path === '/members') && !search) {

        const table = (path === '/faculties') ? "Faculties" : "Members";

        const response = await handleRoutes(req, env, table, is_post, is_get, is_delete);
        return response;
    }

    else if ((path.startsWith('/faculties/') || path.startsWith('/members/')) && !search) {

        const table = (path.startsWith('/faculties/')) ? "Faculties" : "Members";
        const dataID = decodeURIComponent(path.split('/')[2]);  // Get the id from the URL path

        const response = await handleIDRoutes(req, env, table, dataID, is_get, is_put, is_delete);
        return response;
    }

    else if ((path.startsWith('/faculties') || path.startsWith('/members')) && search) {

        const table = (path.startsWith('/faculties')) ? "Faculties" : "Members";

        const columns = ["id", "name", "role", "image", "mobile"];
        if (path.startsWith('/members')) {
            columns.push("roll");
        }

        const response = await handleQueryRoutes(columns, env, table, searchParams);
        return response;
    }

    else if (path === '/events' && !search) {
        const table = 'Events';

        const response = await handleRoutes(req, env, table, is_post, is_get, is_delete);
        return response;
    }

    else if (path.startsWith('/events/') && !search) {
        const table = 'Events';
        const dataID = decodeURIComponent(path.split('/')[2]);  // Get the Event id from the URL path

        const response = await handleIDRoutes(req, env, table, dataID, is_get, is_put, is_delete);
        return response;
    }


    else if ((path.startsWith('/events')) && search) {

        const table = "Events";
        const columns = ["id", "title", "image", "page"];

        const response = await handleQueryRoutes(columns, env, table, searchParams);
        return response;
    }

    else if (path === '/teams' && !search) {

        const table = 'Teams';

        const response = await handleRoutes(req, env, table, is_post, is_get, is_delete);
        return response;
    }

    else if (path.startsWith('/teams/') && !search) {

        const table = 'Teams';
        const dataID = decodeURIComponent(path.split('/')[2]);  // Get the Event id from the URL path

        const response = await handleIDRoutes(req, env, table, dataID, is_get, is_put, is_delete);
        return response;
    }

    else if ((path.startsWith('/teams')) && search) {

        const table = "Teams";

        const columns = ["id", "teamName", "eventName", "teamLeader", "newsSource"];

        const response = await handleQueryRoutes(columns, env, table, searchParams);
        return response;
    }

    else if (path === '/participants' && !search) {

        const table = 'Participants';

        const response = await handleRoutes(req, env, table, is_post, is_get, is_delete);
        return response;
    }

    else if (path.startsWith('/participants/') && !search) {

        const table = 'Participants';
        const dataID = decodeURIComponent(path.split('/')[2]);  // Get the Event id from the URL path

        const response = await handleIDRoutes(req, env, table, dataID, is_get, is_put, is_delete);
        return response;
    }

    else if ((path.startsWith('/participants')) && search) {

        const table = "Participants";
        const columns = ["id", "name", "mobile", "email", "year", "department", "college"];

        const response = await handleQueryRoutes(columns, env, table, searchParams);
        return response;
    }

    else {
        return badRequest();
    }
}