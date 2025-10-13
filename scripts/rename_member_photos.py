import os
import json
import sys

def rename_photos(directory):
    """
    Renames member photos in a directory based on their names in members.json.
    It also updates the members.json file with the new filenames.
    Usage: python rename_member_photos.py <directory_path>
    """
    members_json_path = os.path.join(directory, 'members.json')

    if not os.path.isfile(members_json_path):
        print(f"Error: 'members.json' not found in '{directory}'")
        return

    try:
        with open(members_json_path, 'r') as f:
            members = json.load(f)
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {members_json_path}")
        return

    for member in members:
        if 'name' in member and 'image' in member:
            old_image_name = member['image']
            member_name = member['name']
            
            if old_image_name.lower() in ['groupphoto.jpg', 'placeholder.jpg']:
                continue

            old_image_path = os.path.join(directory, old_image_name)

            if os.path.isfile(old_image_path):
                file_extension = os.path.splitext(old_image_name)[1]
                new_image_name = f"{''.join(member_name.split())}{file_extension}"
                new_image_path = os.path.join(directory, new_image_name)

                try:
                    os.rename(old_image_path, new_image_path)
                    print(f"Renamed '{old_image_name}' to '{new_image_name}'")
                    member['image'] = new_image_name
                except OSError as e:
                    print(f"Error renaming file {old_image_name}: {e}")
            else:
                print(f"Warning: Image file not found for {member_name}: {old_image_name}")

    try:
        with open(members_json_path, 'w') as f:
            json.dump(members, f, indent=4)
        print(f"Successfully updated '{members_json_path}'")
    except IOError as e:
        print(f"Error writing updated members.json: {e}")

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python rename_member_photos.py <directory_path>")
        sys.exit(1)
    
    target_directory = sys.argv[1]
    if not os.path.isdir(target_directory):
        print(f"Error: Directory not found at '{target_directory}'")
        sys.exit(1)
        
    rename_photos(target_directory)
