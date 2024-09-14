import { defaultDownloadsPath } from "@main/constants";
import { app, ipcMain } from "electron";

import "./catalogue/get-catalogue";
import "./catalogue/get-game-shop-details";
import "./catalogue/get-games";
import "./catalogue/get-how-long-to-beat";
import "./catalogue/get-random-game";
import "./catalogue/search-games";
import "./catalogue/search-game-repacks";
import "./catalogue/get-game-stats";
import "./catalogue/get-trending-games";
import "./hardware/get-disk-free-space";
import "./library/add-game-to-library";
import "./library/create-game-shortcut";
import "./library/close-game";
import "./library/delete-game-folder";
import "./library/get-game-by-object-id";
import "./library/get-library";
import "./library/open-game";
import "./library/open-game-executable-path";
import "./library/open-game-installer";
import "./library/open-game-installer-path";
import "./library/update-executable-path";
import "./library/remove-game";
import "./library/remove-game-from-library";
import "./misc/open-external";
import "./misc/show-open-dialog";
import "./torrenting/cancel-game-download";
import "./torrenting/pause-game-download";
import "./torrenting/resume-game-download";
import "./torrenting/start-game-download";
import "./user-preferences/get-user-preferences";
import "./user-preferences/update-user-preferences";
import "./user-preferences/auto-launch";
import "./autoupdater/check-for-updates";
import "./autoupdater/restart-and-install-update";
import "./user-preferences/authenticate-real-debrid";
import "./download-sources/get-download-sources";
import "./download-sources/validate-download-source";
import "./download-sources/add-download-source";
import "./download-sources/remove-download-source";
import "./download-sources/sync-download-sources";
import "./auth/sign-out";
import "./auth/open-auth-window";
import "./auth/get-session-hash";
import "./user/get-user";
import "./user/get-blocked-users";
import "./user/block-user";
import "./user/unblock-user";
import "./user/get-user-friends";
import "./user/get-user-stats";
import "./user/report-user";
import "./profile/get-friend-requests";
import "./profile/get-me";
import "./profile/undo-friendship";
import "./profile/update-friend-request";
import "./profile/update-profile";
import "./profile/process-profile-image";
import "./profile/send-friend-request";
import { isPortableVersion } from "@main/helpers";

ipcMain.handle("ping", () => "pong");
ipcMain.handle("getVersion", () => app.getVersion());
ipcMain.handle("isPortableVersion", () => isPortableVersion());
ipcMain.handle("getDefaultDownloadsPath", () => defaultDownloadsPath);
