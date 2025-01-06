import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import type { LibraryGame } from "@types";

import { TextField } from "@renderer/components";
import {
  useDownload,
  useLibrary,
  useToast,
  useUserDetails,
} from "@renderer/hooks";

import { routes } from "./routes";

import * as styles from "./sidebar.css";
import { buildGameDetailsPath } from "@renderer/helpers";

import SteamLogo from "@renderer/assets/steam-logo.svg?react";
import { SidebarProfile } from "./sidebar-profile";
import { sortBy } from "lodash-es";
import {
  ClockIcon,
  CommentDiscussionIcon,
  PlayIcon,
} from "@primer/octicons-react";
import { useSidebarFilters } from "./use-sidebar-filters";
import { Tooltip } from "../tooltip/tooltip";

const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_INITIAL_WIDTH = 250;
const SIDEBAR_MAX_WIDTH = 450;

const initialSidebarWidth = window.localStorage.getItem("sidebarWidth");

export function Sidebar() {
  const filterRef = useRef<HTMLInputElement>(null);

  const { t } = useTranslation("sidebar");
  const { library, updateLibrary } = useLibrary();
  const navigate = useNavigate();

  const [filteredLibrary, setFilteredLibrary] = useState<LibraryGame[]>([]);
  const { toggleFilter, toggleSort, filters } = useSidebarFilters();

  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(
    initialSidebarWidth ? Number(initialSidebarWidth) : SIDEBAR_INITIAL_WIDTH
  );

  const location = useLocation();

  function sortByTitle(library: LibraryGame[]) {
    return sortBy(library, (game) => game.title);
  }

  const sortedLibrary = useMemo(() => {
    return sortByTitle(library);
  }, [library]);

  const { hasActiveSubscription } = useUserDetails();

  const { lastPacket, progress } = useDownload();

  const { showWarningToast } = useToast();

  useEffect(() => {
    updateLibrary();
  }, [lastPacket?.game.id, updateLibrary]);

  const sidebarRef = useRef<HTMLElement>(null);

  const cursorPos = useRef({ x: 0 });
  const sidebarInitialWidth = useRef(0);

  const handleMouseDown: React.MouseEventHandler<HTMLButtonElement> = (
    event
  ) => {
    setIsResizing(true);
    cursorPos.current.x = event.screenX;
    sidebarInitialWidth.current =
      sidebarRef.current?.clientWidth || SIDEBAR_INITIAL_WIDTH;
  };

  const handleFilter: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setFilteredLibrary(
      sortedLibrary.filter((game) =>
        game.title
          .toLowerCase()
          .includes(event.target.value.toLocaleLowerCase())
      )
    );
  };

  function filterReadyToPlay(baseLibrary?: LibraryGame[]) {
    if (baseLibrary) {
      setFilteredLibrary(
        baseLibrary.filter((game) => game.executablePath !== null)
      );
      return;
    }

    setFilteredLibrary((previous) =>
      previous.filter((game) => game.executablePath !== null)
    );
  }

  useEffect(() => {
    if (filters.readyToPlay) {
      filterReadyToPlay(sortedLibrary);
    } else {
      setFilteredLibrary(sortedLibrary);
    }

    if (filterRef.current) {
      filterRef.current.value = "";
    }
  }, [sortedLibrary]);

  useEffect(() => {
    window.onmousemove = (event: MouseEvent) => {
      if (isResizing) {
        const cursorXDelta = event.screenX - cursorPos.current.x;
        const newWidth = Math.max(
          SIDEBAR_MIN_WIDTH,
          Math.min(
            sidebarInitialWidth.current + cursorXDelta,
            SIDEBAR_MAX_WIDTH
          )
        );

        setSidebarWidth(newWidth);
        window.localStorage.setItem("sidebarWidth", String(newWidth));
      }
    };

    window.onmouseup = () => {
      if (isResizing) setIsResizing(false);
    };

    return () => {
      window.onmouseup = null;
      window.onmousemove = null;
    };
  }, [isResizing]);

  const getGameTitle = (game: LibraryGame) => {
    if (lastPacket?.game.id === game.id) {
      return t("downloading", {
        title: game.title,
        percentage: progress,
      });
    }

    if (game.downloadQueue !== null) {
      return t("queued", { title: game.title });
    }

    if (game.status === "paused") return t("paused", { title: game.title });

    return game.title;
  };

  const handleSidebarItemClick = (path: string) => {
    if (path !== location.pathname) {
      navigate(path);
    }
  };

  const handleSidebarGameClick = (
    event: React.MouseEvent,
    game: LibraryGame
  ) => {
    const path = buildGameDetailsPath({
      ...game,
      objectId: game.objectID,
    });
    if (path !== location.pathname) {
      navigate(path);
    }

    if (event.detail === 2) {
      if (game.executablePath) {
        window.electron.openGame(game.id, game.executablePath);
      } else {
        showWarningToast(t("game_has_no_executable"));
      }
    }
  };

  function setSortByCreatedAt() {
    setFilteredLibrary((previous) =>
      sortBy(previous, (game) => game.createdAt).reverse()
    );
  }

  function setSortByTitle() {
    setFilteredLibrary((previous) => sortByTitle(previous));
  }

  function removeReadyToPlayFilter() {
    setFilteredLibrary(sortedLibrary);
  }

  useEffect(() => {
    if (!filters.readyToPlay) {
      removeReadyToPlayFilter();
      return;
    }

    filterReadyToPlay();
  }, [filters.readyToPlay]);

  useEffect(() => {
    if (!filters.sorts.createdAt) {
      setSortByTitle();
      return;
    }

    setSortByCreatedAt();
  }, [filters.sorts.createdAt, library]);

  return (
    <aside
      ref={sidebarRef}
      className={styles.sidebar({
        resizing: isResizing,
        darwin: window.electron.platform === "darwin",
      })}
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        maxWidth: sidebarWidth,
      }}
    >
      <div
        style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <SidebarProfile />

        <div className={styles.content}>
          <section className={styles.section}>
            <ul className={styles.menu}>
              {routes.map(({ nameKey, path, render }) => (
                <li
                  key={nameKey}
                  className={styles.menuItem({
                    active: location.pathname === path,
                  })}
                >
                  <button
                    type="button"
                    className={styles.menuItemButton}
                    onClick={() => handleSidebarItemClick(path)}
                  >
                    {render()}
                    <span>{t(nameKey)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.section}>
            <small className={styles.sectionTitle}>{t("my_library")}</small>
            <section className={styles.filtersContainer}>
              <Tooltip content={t("filterByPlayableTooltip")}>
                <button
                  onClick={() => toggleFilter("readyToPlay")}
                  className={styles.filterButton({
                    active: filters.readyToPlay,
                  })}
                >
                  <PlayIcon size={14} />
                </button>
              </Tooltip>

              <Tooltip content={t("orderByRecentTooltip")}>
                <button
                  onClick={() => toggleSort("createdAt")}
                  className={styles.filterButton({
                    active: filters.sorts.createdAt,
                  })}
                >
                  <ClockIcon size={14} />
                </button>
              </Tooltip>
            </section>
            <TextField
              ref={filterRef}
              placeholder={t("filter")}
              onChange={handleFilter}
              theme="dark"
            />
            <ul className={styles.menu}>
              {filteredLibrary.map((game) => (
                <li
                  key={game.id}
                  className={styles.menuItem({
                    active:
                      location.pathname ===
                      `/game/${game.shop}/${game.objectID}`,
                    muted: game.status === "removed",
                  })}
                >
                  <button
                    type="button"
                    className={styles.menuItemButton}
                    onClick={(event) => handleSidebarGameClick(event, game)}
                  >
                    {game.iconUrl ? (
                      <img
                        className={styles.gameIcon}
                        src={game.iconUrl}
                        alt={game.title}
                        loading="lazy"
                      />
                    ) : (
                      <SteamLogo className={styles.gameIcon} />
                    )}

                    <span className={styles.menuItemButtonLabel}>
                      {getGameTitle(game)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {hasActiveSubscription && (
        <button
          type="button"
          className={styles.helpButton}
          data-open-support-chat
        >
          <div className={styles.helpButtonIcon}>
            <CommentDiscussionIcon size={14} />
          </div>
          <span>{t("need_help")}</span>
        </button>
      )}

      <button
        type="button"
        className={styles.handle}
        onMouseDown={handleMouseDown}
      />
    </aside>
  );
}
