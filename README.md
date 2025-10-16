# McGill HKSN Website

This is the official website for the McGill Hong Kong Student Network (HKSN). This document provides instructions on how to update the website's content.

## Updating Website Content

Most of the website's content is loaded dynamically from JSON files and configured through a central configuration file. This makes it easy to update the site for a new academic year.

### Setting the Current Year for Content

The website can display content from different years. You can configure the year for the homepage carousel and the events page separately.

1.  Open `js/config.js`.
2.  Modify `homePageContentYear` to set the year for the home page carousel.
3.  Modify `eventsContentYear` to set the year for the events page.

```javascript
const siteConfig = {
  homePageContentYear: "2025-2026", // Change this value for the home page
  eventsContentYear: "2025-2026",   // Change this value for the events page
  // ...
};
```

This will make the website load data from `assets/data/2025-2026/`.

### Adding a New Year of Executive Members

To add a new team of executive members for an academic year:

1.  **Create a new directory** under `assets/members/`. The directory name should be the academic year (e.g., `2025-2026`).

2.  **Add member images** to this new directory. Don't forget to also add a `groupPhoto.jpg`.

3.  **Create a `members.json` file** inside the new year's directory (`assets/members/2025-2026/members.json`). This file should contain an array of member objects, each with a `name`, `position`, and `image` (the filename of their picture).

    *Example `members.json`:*
    ```json
    [
      {
        "name": "John Doe",
        "position": "President",
        "image": "john.jpg"
      },
      {
        "name": "Jane Smith",
        "position": "VP Internal",
        "image": "jane.png"
      }
    ]
    ```

4.  **Update the configuration** to include the new year. Open `js/config.js` and add the new year to the `allYears` array. Make sure the newest year is the first element in the array.

    ```javascript
    const siteConfig = {
      // ...
      allYears: ["2025-2026", "2024-2025", "2023-2024", "2019-2020"], // Add new year here
      // ...
    };
    ```
    The "About Us" page will automatically populate the year selector dropdown with this new year.

### Updating Home Page Carousel and Events for a New Year

The home page carousel and the events page content are loaded based on the `homePageContentYear` and `eventsContentYear` set in `js/config.js`. To add content for a new year:

1.  **Create a new directory** under `assets/data/` with the name of the new academic year (e.g., `2025-2026`).

2.  **Create `carousel.json`**: Inside the new directory, create a `carousel.json` file. This file defines the images shown on the home page carousel.

    *Example `carousel.json`*:
    ```json
    [
      {
        "image": "./assets/events/welcomeParty/1.jpg",
        "alt": "Welcome Party Fun"
      },
      {
        "image": "./assets/events/halloween/1.jpg",
        "alt": "Spooky Halloween Event"
      }
    ]
    ```

3.  **Create `events.json`**: In the same directory, create an `events.json` file. This file lists all the events that will be displayed on the "Events" page.

    *Example `events.json`*:
    ```json
    [
      {
        "id": "welcome-party",
        "title": "Welcome Party",
        "subtitle": "Kick off the year with us!",
        "description": "Join us for a night of fun, games, and making new friends.",
        "images": ["welcomeParty/1.jpg", "welcomeParty/2.jpg"],
        "displayInfoOnCard": true
      }
    ]
    ```

4.  **Add event images**: Place the images for your events into corresponding subfolders within the `assets/events/` directory (e.g., `assets/events/newEvent/`).

### Updating the Discount Card Information

The information for the discount card on the "Store" page is hardcoded. To update it:

1.  Open `store/index.html`.
2.  Locate the section with the class `description`. You can edit the text directly in the HTML.
    ```html
    <div class="description">
        <div class="row align-items-center">
            <div class="col-md-5 text-md-start">
                <h1 class="display-5 fw-bold mb-4">Discount Card</h1>
                <p class="lead mb-4">
                    Get your discount card for the 2025-2026 academic year! ...
                </p>
                <!-- ... more text ... -->
            </div>
            <div class="col-md-7">
                <img src="../assets/membershipCard/front.jpg" class="img-fluid rounded-4" alt="HKSN Membership Card">
            </div>
        </div>
    </div>
    ```
3.  To change the images for the membership card or the sponsor list, replace the image files in the `assets/membershipCard/` directory. The filenames are `front.jpg`, `back.jpg`, and `sponsorlist.png`.

## Developer Tools and Workflow

### Image Processing Workflow

Before adding new member or event photos to the repository, please process them as follows:

1.  **Crop Photos**: Crop all photos to a 500x500 resolution. A recommended free tool for macOS is **Bulk Cropper**, which can intelligently crop to faces.
2.  **Optimize Images**: Run all new images through an optimizer to reduce their file size. **ImageOptim** is a great free tool for this on macOS.

This workflow ensures that the website loads quickly and that all images are consistent.

### Helper Scripts

The `scripts/` directory contains Python scripts to help manage member photos.

#### `rename_member_photos.py`

-   **Purpose**: To standardize member photo filenames. This script renames photo files based on the member's `name` in `members.json` and updates the `image` field in the JSON file accordingly.
-   **Usage**:
    ```bash
    python scripts/rename_member_photos.py assets/members/<year-directory>/
    ```
    *Example:* `python scripts/rename_member_photos.py assets/members/2025-2026/`

#### `cleanup_members_photos.py`

-   **Purpose**: To remove unused photos from the repository. This script will delete any photos in a member directory that are not listed in that directory's `members.json` file. `groupPhoto.jpg` is always preserved.
-   **Usage**:
    ```bash
    python scripts/cleanup_members_photos.py assets/members/<year-directory>/
    ```
    *Example:* `python scripts/cleanup_members_photos.py assets/members/2025-2026/`
