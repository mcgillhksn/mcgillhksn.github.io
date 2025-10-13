import os
import json
import sys

def cleanup_photos(directory):
    """
    Deletes photos in a directory that are not listed in a 'members.json' file
    within that same directory. 'groupPhoto.jpg' is always preserved.
    """
    json_path = os.path.join(directory, 'members.json')

    if not os.path.exists(json_path):
        print(f"Error: 'members.json' not found in '{directory}'.")
        return

    try:
        with open(json_path, 'r') as f:
            members = json.load(f)
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from '{json_path}'.")
        return

    # Create a set of image filenames that should be kept.
    images_to_keep = {member['image'] for member in members if 'image' in member}
    images_to_keep.add('groupPhoto.jpg')

    # Get all files in the directory.
    try:
        files_in_dir = os.listdir(directory)
    except FileNotFoundError:
        print(f"Error: Directory '{directory}' not found.")
        return

    deleted_count = 0
    for filename in files_in_dir:
        # Process only image files (common extensions).
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
            if filename not in images_to_keep:
                file_path_to_delete = os.path.join(directory, filename)
                try:
                    os.remove(file_path_to_delete)
                    print(f"Deleted: {filename}")
                    deleted_count += 1
                except OSError as e:
                    print(f"Error deleting file {filename}: {e}")

    print(f"\nCleanup complete for '{directory}'.")
    print(f"Total files deleted: {deleted_count}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python cleanup_members_photos.py <directory_path>")
        sys.exit(1)
    
    target_directory = sys.argv[1]
    cleanup_photos(target_directory)
