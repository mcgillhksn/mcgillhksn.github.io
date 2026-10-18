# McGill HKSN Website

This is the official website for the McGill Hong Kong Student Network (HKSN). This guide explains how to update the text, photos, team, events, and discount-card offers.

## Updating Website Content

Most updates involve editing a few words or uploading photos. Use the file guide below to find the right place.

| What you want to update | Where to look |
| --- | --- |
| Homepage text | `index.html` |
| About page introduction | `about/index.html` |
| Team names, roles, and photos | `assets/members/[year]/` |
| Homepage photo slideshow | `assets/data/[year]/carousel.json` |
| Events and their photo galleries | `assets/data/[year]/events.json` and `assets/events/` |
| Discount-card price and description | `index.html` and `store/index.html` |
| Restaurant, drink, and dessert offers | `assets/data/discount-card.json` |

Replace `[year]` with an academic year written like `2025-2026`.

**A few things to keep in mind:**

- If you are editing on GitHub, open the file and choose the pencil icon to edit it.
- In files ending in `.json`, keep the quotation marks, commas, and brackets in place. Use the examples below as a guide.
- Photo filenames must match exactly, including capital letters and endings such as `.jpg`, `.jpeg`, or `.png`.
- Keep a copy of any text or photos you are replacing, and check the website after saving your changes.

### Choosing Which Academic Year to Show

The homepage and Events page can show content from different academic years.

1. Prepare that year's event list and slideshow using the steps below.
2. Open `js/config.js`.
3. Find `homePageContentYear` and change the year inside its quotation marks. This chooses the homepage slideshow and featured events.
4. Find `eventsContentYear` and change its year to choose the Events page archive.

For example, these two lines select `2025-2026`:

```javascript
homePageContentYear: "2025-2026",
eventsContentYear: "2025-2026",
```

Change only the year values; leave the rest of the file in place. The matching `assets/data/2025-2026/` folder must contain both `carousel.json` and `events.json` before selecting it for the homepage.

### Updating the Team

1. Open `assets/members/` and find or create the academic-year folder, such as `2025-2026`.
2. Upload each person's portrait into that folder. Also upload the team photo with the exact filename `groupPhoto.jpg`.
3. Open or create `members.json` in the same folder. List each person's name, role, and portrait filename, following this example:

```json
[
  {
    "name": "John Doe",
    "position": "Co-President",
    "image": "john.jpg"
  },
  {
    "name": "Jane Smith",
    "position": "VP Internal",
    "image": "jane.png"
  }
]
```

4. In `js/config.js`, find `allYears`. Add the academic year at the beginning of the list, inside quotation marks and followed by a comma. Keep the other listed years in place.
5. Visit the About page and check the team archive selector. The first year in `allYears` is the team shown when the page opens.

If a portrait is not available, use `"image": "Placeholder.jpg"`. The website will show that person's initials.

### Updating Events

1. Upload the event photos into a folder inside `assets/events/`, such as `assets/events/welcomeParty/`.
2. Open or create `assets/data/[year]/events.json` for the academic year you are updating.
3. Add the event's details using this example. Give each event its own `id`, written without spaces.

```json
[
  {
    "id": "welcome-party",
    "title": "Welcome Party",
    "category": "Community",
    "description": "Our first get-together of the year, full of games and familiar faces.",
    "images": ["welcomeParty/1.jpg", "welcomeParty/2.jpg"],
    "coverIsPoster": true,
    "homeFeatured": true
  }
]
```

What each detail means:

- `title`: the event name visitors see.
- `category`: choose exactly `Community`, `Culture`, or `Nights out`.
- `description`: a short recap of the event.
- `images`: the photo filenames in the order you want them shown. Start with the event folder name, such as `welcomeParty/1.jpg`.
- `coverIsPoster`: use `true` if the first image is a poster or collage with text; use `false` for a photograph.
- `homeFeatured`: use `true` to include the event among the homepage highlights. Up to three events are shown, in their listed order.

The first picture is also used as the event's cover. To choose a different cover, add a line such as `"cover": "welcomeParty/2.jpg",` and use `coverIsPoster` to describe that picture. You can also add `coverAlt` with a short description of the cover picture.

When listing more than one event, separate the events with a comma, just like the two people in the team example.

### Updating the Homepage Photo Slideshow

Open `assets/data/[year]/carousel.json`. List the pictures in the order you want them to appear:

```json
[
  {
    "image": "./assets/events/semiFormal/1.jpg",
    "alt": "Friends celebrating at the semi-formal"
  },
  {
    "image": "./assets/events/welcomeParty/1.jpg",
    "alt": "The first hello at our Welcome Party",
    "poster": true
  }
]
```

- `image`: where the picture is saved. Keep `./assets/events/` at the beginning.
- `alt`: a short description of the picture, also shown as its caption.
- `poster`: include `true` for posters or collages with text so the whole picture stays visible.

### Updating the Discount Card

**Price, description, and artwork**

1. Open `store/index.html` and the discount-card section of `index.html`.
2. Search for the price, academic year, or wording you want to change. Edit the words and numbers while keeping the surrounding symbols in place.
3. Check the price, year, availability message, and picture descriptions on both pages so they agree.
4. Save the card artwork as `assets/membershipCard/front.jpg` and the offer sheet as `assets/membershipCard/sponsorlist.png`. The Discount card page includes a link to the offer sheet.

**Partner offers**

Open `assets/data/discount-card.json`. Update `academicYear` and edit the partner details under `partners`. For example:

```json
{
  "name": "Ramen Isshin",
  "category": "restaurants",
  "offer": "15%",
  "terms": "All locations"
}
```

- `name`: the business name.
- `category`: use `restaurants` for restaurants, or `drinks` for drinks and desserts.
- `offer`: the discount or benefit visitors receive.
- `terms`: any conditions, such as participating locations or excluded items. Leave this detail out if there are no conditions to list.

Keep the category list near the top of the file in place. Separate partner entries with commas, and do not put a comma after the final entry.

Confirm each offer with the partner before publishing it. Check the directory's year labels in `store/index.html` against the card and offer sheet, then test the search and category buttons on the website.

## Developer Tools and Workflow

### Image Processing Workflow

Before adding new member or event photos to the repository, please process them as follows:

1.  **Crop Portraits**: Crop member portraits to a 500x500 resolution. A recommended free tool for macOS is **Bulk Cropper**, which can intelligently crop to faces. Keep event photographs in their original proportions and do not crop posters containing text.
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
