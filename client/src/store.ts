import {
    configureStore,
    isRejectedWithValue,
    type Middleware,
} from "@reduxjs/toolkit";
import { api } from "./services/api";
import { emitToast } from "./components/ToastProvider";

// Surface any failed query/mutation as an error toast. 409s are handled
// locally by the add-to-playlist flow (duplicate song), so skip them here.
const errorToastMiddleware: Middleware = () => (next) => (action) => {
    if (isRejectedWithValue(action)) {
        const payload = action.payload as
            | { status?: number | string; data?: { error?: string } }
            | undefined;
        if (payload?.status !== 409) {
            const message =
                payload?.data?.error ||
                (payload?.status === "FETCH_ERROR"
                    ? "Can't reach the backend — is app.py running?"
                    : "Something went wrong.");
            emitToast(message, "error");
        }
    }
    return next(action);
};

export const store = configureStore({
    reducer: {
        [api.reducerPath]: api.reducer,
    },
    middleware: (getDefault) => getDefault().concat(api.middleware, errorToastMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
