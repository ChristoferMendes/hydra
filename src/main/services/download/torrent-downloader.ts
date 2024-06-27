import cp from "node:child_process";

import { Game } from "@main/entity";
import { RPC_PORT, startTorrentClient } from "./torrent-client";
import { gameRepository } from "@main/repository";
import { DownloadProgress } from "@types";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { calculateETA } from "./helpers";
import axios from "axios";

enum LibtorrentStatus {
  CheckingFiles = 1,
  DownloadingMetadata = 2,
  Downloading = 3,
  Finished = 4,
  Seeding = 5,
}

interface LibtorrentPayload {
  progress: number;
  numPeers: number;
  numSeeds: number;
  downloadSpeed: number;
  bytesDownloaded: number;
  fileSize: number;
  folderName: string;
  status: LibtorrentStatus;
  gameId: number;
}

export class TorrentDownloader {
  private static torrentClient: cp.ChildProcess | null = null;
  private static downloadingGameId = -1;
  private static rpc = axios.create({
    baseURL: `http://localhost:${RPC_PORT}`,
  });

  private static spawn() {
    this.torrentClient = startTorrentClient();
  }

  public static kill() {
    if (this.torrentClient) {
      this.torrentClient.kill();
      this.torrentClient = null;
      this.downloadingGameId = -1;
    }
  }

  public static async getStatus() {
    if (!this.torrentClient) this.spawn();
    if (this.downloadingGameId === -1) return null;

    const response = await this.rpc.get<LibtorrentPayload | null>("/status");

    if (response.data === null) return null;

    try {
      const {
        progress,
        numPeers,
        numSeeds,
        downloadSpeed,
        bytesDownloaded,
        fileSize,
        folderName,
        status,
        gameId,
      } = response.data;

      this.downloadingGameId = gameId;

      const isDownloadingMetadata =
        status === LibtorrentStatus.DownloadingMetadata;

      const isCheckingFiles = status === LibtorrentStatus.CheckingFiles;

      if (!isDownloadingMetadata) {
        const update: QueryDeepPartialEntity<Game> = {
          bytesDownloaded,
          fileSize,
          progress,
        };

        await gameRepository.update(
          { id: gameId },
          {
            ...update,
            folderName,
          }
        );
      }

      if (progress === 1 && !isCheckingFiles) {
        this.downloadingGameId = -1;
      }

      return {
        numPeers,
        numSeeds,
        downloadSpeed,
        timeRemaining: calculateETA(fileSize, bytesDownloaded, downloadSpeed),
        isDownloadingMetadata,
        isCheckingFiles,
        progress,
        gameId,
      } as DownloadProgress;
    } catch (err) {
      return null;
    }
  }

  static async pauseDownload() {
    if (!this.torrentClient) this.spawn();

    await this.rpc
      .post("/action", {
        action: "pause",
        game_id: this.downloadingGameId,
      })
      .catch(() => {});

    this.downloadingGameId = -1;
  }

  static async startDownload(game: Game) {
    if (!this.torrentClient) this.spawn();

    await this.rpc.post("/action", {
      action: "start",
      game_id: game.id,
      magnet: game.uri,
      save_path: game.downloadPath,
    });

    this.downloadingGameId = game.id;
  }

  static async cancelDownload(gameId: number) {
    if (!this.torrentClient) this.spawn();

    await this.rpc.post("/action", {
      action: "cancel",
      game_id: gameId,
    });

    this.downloadingGameId = -1;
  }
}
