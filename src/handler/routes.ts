import { Env } from "..";
import { badEntity, badRequest, notAllowed, notFound, returnJson, serverError } from "./responses";
import { deleteRowById, dropEntireTable, getDataByTable, getRowByCol, getRowByID, insertRowInTable, updateRowById } from "../database/d1sqlite";


async function validateRequest(req: Request, table: string, is_post: boolean, is_put: boolean): Promise<any> {
    let reqData;

    try {

        if (table === "Faculties" || table === "Members") {

            reqData = await req.json() as { name: string; role: string; image: string; mobile: number; roll: string; };
            const { name, role, image, mobile } = reqData;

            if (is_post) {

                if (!name || !role || !image || !mobile) { // If any field is missing
                    return [false, null];
                }

                if (table === 'Members' && !reqData.roll) { // If roll field is missing for Members
                    return [false, null];
                }
            }

            else if (is_put && (!name && !role && !image && !mobile)) { // no field is provided
                return [false, null];
            }
        }

        else if (table === 'Events') {

            reqData = await req.json() as { title: string; page: string; image: string };
            const { title, page, image } = reqData;

            if (is_post && (!title || !page || !image)) { // If any field is missing
                return [false, null];
            }

            else if (is_put && (!title && !page && !image)) {
                return [false, null];
            }
        }

        else if (table === 'Teams') {

            reqData = await req.json() as { teamName: string; eventName: string; teamLeader: string; paymentID: string, newsSource: string };
            const { teamName, eventName, teamLeader, paymentID, newsSource } = reqData;

            if (is_post && (!teamName || !eventName || !teamLeader || !paymentID || !newsSource)) { // Check If any required field is missing
                return [false, null];
            }

            else if (is_put && (!teamName && !eventName && !teamLeader && !paymentID && !newsSource)) {
                return [false, null];
            }
        }

    } catch (e) {
        console.error(e);
        return [false, null];
    }

    return [true, reqData];
}


export async function handleRoutes(req: Request, env: Env, table: string, is_post: boolean, is_get: boolean, is_delete: boolean): Promise<any> {

    if (is_post) {

        const [is_valid, reqData] = await validateRequest(req, table, is_post, false);
        if (!is_valid)
            return badEntity();
        // Insert new data in the D1 store
        const response = await insertRowInTable(env, reqData, table);
        return response;
    }

    else if (is_get) {
        const details = await getDataByTable(env, table);
        if (details) {
            return returnJson(details);
        }
        return notFound();
    }

    else if (is_delete) {
        const response = await dropEntireTable(env, table);
        return response;
    }

    else {
        return notAllowed();
    }
}

export async function handleIDRoutes(req: Request, env: Env, table: string, dataID: string, is_get: boolean, is_put: boolean, is_delete: boolean): Promise<any> {

    if (is_get) {
        const response = await getRowByID(env, dataID, table);
        return response;
    }

    else if (is_put) {

        const [is_valid, newData] = await validateRequest(req, table, false, is_put);
        if (!is_valid)
            return badEntity();
        // Update data in the D1 store
        const response = await updateRowById(env, dataID, newData, table);
        return response;
    }

    else if (is_delete) {
        const response = await deleteRowById(env, dataID, table);
        return response;
    }

    else {
        return notAllowed();
    }
}

export async function handleQueryRoutes(columns: any, env: Env, table: string, searchParams: any): Promise<any> {

    for (const key of searchParams.keys()) {

        const value = searchParams.get(key); // Get the Query Value

        if (columns.includes(key)) { // Search for known column in Query Key

            const [exists, results] = await getRowByCol(env, key, value, table);
            if (exists && results) {
                return returnJson(results);
            }
            else if (!exists) {
                return notFound();
            }
            else {
                return serverError();
            }
        }
    }

    return badRequest();
}