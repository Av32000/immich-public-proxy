// How many thumbnails to load per "page" fetched from Immich
const PER_PAGE = 50;

class LGallery {
  items;
  lightGallery;
  element;
  index = PER_PAGE;

  /**
   * Create a lightGallery instance and populate it with the first page of gallery items
   */
  init(params = {}) {
    // Create the lightGallery instance
    this.element = document.getElementById("lightgallery");
    this.lightGallery = lightGallery(
      this.element,
      Object.assign(
        {
          plugins: [lgZoom, lgThumbnail, lgVideo, lgFullscreen, lgHash],
          speed: 400,
          toggleThumb: true,
          allowMediaOverlap: true,
          /*
      This license key was graciously provided by LightGallery under their
      GPLv3 open-source project license:
      */
          licenseKey: "8FFA6495-676C4D30-8BFC54B6-4D0A6CEC",
          /*
      Please do not take it and use it for other projects, as it was provided
      specifically for Immich Public Proxy.

      For your own projects you can use the default license key of
      0000-0000-000-0000 as per their docs:

      https://www.lightgalleryjs.com/docs/settings/#licenseKey
      */
        },
        params.lgConfig,
      ),
    );
    this.items = params.items;

    // Listen for slide change to update the metadata panel
    this.element.addEventListener("lgAfterSlide", (event) => {
      const panel = document.getElementById("lg-metadata-panel");
      if (panel && panel.classList.contains("open")) {
        this.updateMetadata();
      }
    });

    // Close metadata panel when gallery is closed
    this.element.addEventListener("lgBeforeClose", () => {
      const panel = document.getElementById("lg-metadata-panel");
      if (panel && panel.classList.contains("open")) {
        this.toggleMetadata();
      }
    });

    // Add info button to toolbar when lightGallery reaches afterOpen
    this.element.addEventListener("lgAfterOpen", () => {
      const toolbar = document.querySelector(".lg-toolbar");
      if (toolbar && !document.getElementById("lg-toolbar-info")) {
        const infoButton = `<button type="button" id="lg-toolbar-info" class="lg-icon" width="50" height="47" onclick="lgallery.toggleMetadata()" title="Show Information">
          <img src="/share/static/images/information.svg" width="20" height="20">
        </button>`;
        toolbar.insertAdjacentHTML("beforeend", infoButton);
      }
    });

    const spinner = document.getElementById("loading-spinner");
    if (spinner) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            lgallery.loadMoreItems(observer, spinner);
          }
        },
        { rootMargin: "200px" },
      );
      observer.observe(spinner);
    }
  }

  /**
   * Load more gallery items as per lightGallery docs
   * https://www.lightgalleryjs.com/demos/infinite-scrolling/
   */
  loadMoreItems(observer, spinner) {
    if (this.index < this.items.length) {
      // Append new thumbnails
      this.items.slice(this.index, this.index + PER_PAGE).forEach((item) => {
        this.element.insertAdjacentHTML("beforeend", item.html + "\n");
      });
      this.index += PER_PAGE;
      this.lightGallery.refresh();
    } else {
      // Remove the loading spinner and stop observing once all items are loaded
      observer.disconnect();
      spinner.remove();
    }
  }

  /**
   * Toggle the metadata panel on the right of the screen
   */
  toggleMetadata() {
    let panel = document.getElementById("lg-metadata-panel");
    const outer = document.querySelector(".lg-outer");

    if (!panel) {
      panel = document.createElement("div");
      panel.id = "lg-metadata-panel";
      panel.innerHTML = `
        <div class="metadata-header">
        <h3>Informations</h3>
        <button id="lg-metadata-close" style="background:none; border:none; cursor:pointer;" onclick="lgallery.toggleMetadata()">
          <img src="/share/static/images/close.svg" width="24" height="24">
        </button>
        </div>
        <div class="metadata-content" id="lg-metadata-content"></div>
      `;
      document.body.appendChild(panel);
    }

    if (panel.classList.contains("open")) {
      panel.classList.remove("open");
      if (outer) outer.classList.remove("lg-metadata-open");
    } else {
      this.updateMetadata();
      panel.classList.add("open");
      if (outer) outer.classList.add("lg-metadata-open");
    }
  }

  /**
   * Update the content of the metadata panel with the current active asset's metadata
   */
  updateMetadata() {
    const activeSlide =
      this.element.querySelector(`.lg-item.lg-current`) ||
      document.querySelector(`.lg-current`);

    // In lightgallery, we can also get the current slide index from the instance
    const currentIndex = this.lightGallery.index;
    const currentItem = this.items[currentIndex];

    // Attempt to extract metadata from the data-exif attribute of the anchor
    const anchors = document.querySelectorAll("#lightgallery a");
    const activeAnchor = anchors[currentIndex];

    const panelContent = document.getElementById("lg-metadata-content");
    if (!panelContent || !activeAnchor) return;

    let metadata = {};
    try {
      const exifData = activeAnchor.getAttribute("data-exif");
      if (exifData) {
        metadata = JSON.parse(exifData);
      }
    } catch (e) {
      console.error("Failed to parse metadata", e);
    }

    let html = "";

    // Add file info section
    let blocks = [];

    blocks.push({
      group: "Details",
      title: activeAnchor.getAttribute("data-download") || "",
      subtitles: [
        metadata["exifImageWidth"] && metadata["exifImageHeight"]
          ? `${((metadata["exifImageWidth"] * metadata["exifImageHeight"]) / 1000000).toFixed(0)} MP`
          : "",

        metadata["exifImageWidth"] && metadata["exifImageHeight"]
          ? `${metadata["exifImageWidth"]} x ${metadata["exifImageHeight"]}`
          : "",
        metadata["fileSizeInByte"]
          ? `  ${(metadata["fileSizeInByte"] / (1024 * 1024)).toFixed(0)} MiB`
          : "",
      ].filter((v) => !!v),
    });

    if (metadata["dateTimeOriginal"]) {
      const date = new Date(metadata["dateTimeOriginal"]);
      blocks.push({
        group: "Details",
        title: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        subtitles: [
          date.toLocaleString("en-US", {
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          }),
        ],
      });
    }

    blocks.push({
      group: "Camera",
      title:
        `${metadata["make"] || ""}${metadata["model"] ? ` ${metadata["model"]}` : ""}`.trim(),
      subtitles: [
        (metadata["exposureTime"] || "") + " s",
        metadata["iso"] ? "ISO " + metadata["iso"] : "",
      ].filter((v) => !!v),
    });

    blocks.push({
      group: "Camera",
      title: metadata["lensModel"] || "",
      subtitles: [
        metadata["fNumber"] ? `ƒ/${metadata["fNumber"]}` : "",
        metadata["focalLength"] ? `${metadata["focalLength"]} mm` : "",
      ].filter((v) => !!v),
    });

    const groups = [...new Set(blocks.map((b) => b.group))];

    groups.forEach((group) => {
      const groupBlocks = blocks.filter((b) => b.group === group);
      const groupHtml = groupBlocks
        .map((b) => {
          if (!b.title && !b.subtitles.length) return "";
          const subtitlesHtml = b.subtitles
            .map((s) => `<span>${s}</span>`)
            .join("");

          return `<div class="metadata-row">
            <span class="metadata-label">${b.title}</span>
            <span class="metadata-subtitles">${subtitlesHtml}</span>
          </div>`;
        })
        .join("");

      if (groupHtml) {
        html += `<div class="metadata-section">
          <h4>${group}</h4>
          ${groupHtml}
        </div>`;
      }
    });

    panelContent.innerHTML = html;
  }
}
const lgallery = new LGallery();
