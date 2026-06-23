import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { store } from "./store";
import { PlayerProvider } from "./player/PlayerContext";
import { ToastProvider } from "./components/ToastProvider";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <ToastProvider>
                    <PlayerProvider>
                        <App />
                    </PlayerProvider>
                </ToastProvider>
            </BrowserRouter>
        </Provider>
    </React.StrictMode>
);
